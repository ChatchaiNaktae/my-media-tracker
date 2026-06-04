from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
import time
from database import collection, users_coll
from extensions import limiter

# Create a Blueprint for API routes
api = Blueprint('api', __name__)
bcrypt = Bcrypt()

@api.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    data = request.get_json()
    if users_coll.find_one({"username": data['username']}):
        return jsonify({"message": "Username already exists!"}), 400

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    # Fix bug: Changed 'hashed_password' to 'hashed_pw' to prevent Server Error (500)
    users_coll.insert_one({"username": data['username'], "password": hashed_pw})
    return jsonify({"message": "User registered successfully"}), 201

@api.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    user = users_coll.find_one({"username": data['username']})

    if user and bcrypt.check_password_hash(user['password'], data['password']):
        access_token = create_access_token(identity=data['username'])
        refresh_token = create_refresh_token(identity=data['username'])
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    return jsonify({"message": "Invalid username or password"}), 401

@api.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user)
    return jsonify(access_token=new_access_token), 200

@api.route('/items', methods=['GET'])
@jwt_required()
def get_items():
    current_user = get_jwt_identity()
    items = list(collection.find({"username": current_user}, {'_id': 0}).sort('id', -1))
    return jsonify(items)

@api.route('/items', methods=['POST'])
@jwt_required()
def add_item():
    current_user = get_jwt_identity()
    data = request.get_json()
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ── Input validation ──────────────────────────────────────────
    title = data.get('title', '').strip()
    if not isinstance(title, str) or len(title) == 0:
        return jsonify({"message": "Title is required and must be a non-empty string."}), 400
    if len(title) > 500:
        return jsonify({"message": "Title must be 500 characters or fewer."}), 400

    category = data.get('category', '').strip()
    if not isinstance(category, str) or len(category) == 0:
        return jsonify({"message": "Category is required and must be a non-empty string."}), 400
    if len(category) > 100:
        return jsonify({"message": "Category must be 100 characters or fewer."}), 400

    status = data.get('status', 'Planned')
    allowed_statuses = {'Planned', 'Completed', 'Dropped', 'OnHold'}
    if status not in allowed_statuses:
        return jsonify({"message": f"Invalid status. Must be one of: {', '.join(sorted(allowed_statuses))}"}), 400

    # Validate numeric fields
    try:
        rating = int(data.get('rating', 0))
        if rating < 0 or rating > 5:
            return jsonify({"message": "Rating must be between 0 and 5."}), 400
    except (TypeError, ValueError):
        return jsonify({"message": "Rating must be a valid integer."}), 400

    try:
        current_progress = int(data.get('current_progress', 0))
        if current_progress < 0:
            return jsonify({"message": "Current progress must be 0 or greater."}), 400
    except (TypeError, ValueError):
        return jsonify({"message": "Current progress must be a valid integer."}), 400

    try:
        total_count = int(data.get('total_count', 0))
        if total_count < 0:
            return jsonify({"message": "Total count must be 0 or greater."}), 400
    except (TypeError, ValueError):
        return jsonify({"message": "Total count must be a valid integer."}), 400

    # Validate string fields with length limits
    link = str(data.get('link', '')).strip()
    if len(link) > 2000:
        return jsonify({"message": "Link must be 2000 characters or fewer."}), 400

    review = str(data.get('review', '')).strip()
    if len(review) > 5000:
        return jsonify({"message": "Review must be 5000 characters or fewer."}), 400

    cover_image = str(data.get('cover_image', '')).strip()
    if len(cover_image) > 2000:
        return jsonify({"message": "Cover image URL must be 2000 characters or fewer."}), 400

    tags = str(data.get('tags', '')).strip()
    if len(tags) > 1000:
        return jsonify({"message": "Tags must be 1000 characters or fewer."}), 400
    # ── End validation ──────────────────────────────────────────────

    new_id = data.get('id')
    if not new_id:
        new_id = int(time.time() * 1000)

    new_item = {
        "id": new_id,
        "username": current_user,
        "title": title,
        "category": category,
        "status": status,
        "rating": rating,
        "link": link,
        "review": review,
        "current_progress": current_progress,
        "total_count": total_count,
        "cover_image": cover_image,
        "tags": tags,
        "created_at": data.get('created_at', current_time),
        "updated_at": data.get('updated_at', current_time)
    }

    collection.insert_one(new_item)
    return jsonify({"id": new_id, "message": "Item added!"}), 201

@api.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    update_fields = {}
    for key in ['title', 'category', 'status', 'rating', 'link', 'review', 'current_progress', 'total_count', 'cover_image', 'tags']:
        if key in data:
            update_fields[key] = data[key]

    update_fields['updated_at'] = current_time

    # Update only the item belonging to the current user
    result = collection.update_one({'id': item_id, 'username': current_user}, {'$set': update_fields})

    if result.matched_count == 0:
        return jsonify({"message": "Not found or unauthorized"}), 403

    return jsonify({"message": "Updated!"})

@api.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    current_user = get_jwt_identity()

    # Delete only the item belonging to the current user
    result = collection.delete_one({'id': item_id, 'username': current_user})

    if result.deleted_count == 0:
        return jsonify({"message": "Not found or unauthorized"}), 403

    return jsonify({"message": "Deleted!"})

@api.route('/items/batch-delete', methods=['POST'])
@jwt_required()
def batch_delete_items():
    current_user = get_jwt_identity()
    data = request.get_json()
    ids_to_delete = data.get('ids', [])
    if not ids_to_delete:
        return jsonify({"message": "No IDs provided"}), 400

    # Batch delete only the items belonging to the current user
    result = collection.delete_many({'id': {'$in': ids_to_delete}, 'username': current_user})
    return jsonify({"message": f"Deleted {result.deleted_count} items"}), 200
