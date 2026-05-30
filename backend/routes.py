from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import time
from database import collection, users_coll
from config import Config

# Create a Blueprint for API routes
api = Blueprint('api', __name__)
bcrypt = Bcrypt()

@api.route('/register', methods=['POST'])
def register():
    client_key = request.headers.get('X-API-Key')
    
    if client_key != Config.MASTER_API_KEY:
        return jsonify({"message": "Unauthorized: Master Key สำหรับสมัครสมาชิกไม่ถูกต้อง!"}), 401
    
    data = request.get_json()
    if users_coll.find_one({"username": data['username']}):
        return jsonify({"message": "Username already exists!"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    # Fix bug: Changed 'hashed_password' to 'hashed_pw' to prevent Server Error (500)
    users_coll.insert_one({"username": data['username'], "password": hashed_pw})
    return jsonify({"message": "User registered successfully"}), 201

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_coll.find_one({"username": data['username']})

    if user and bcrypt.check_password_hash(user['password'], data['password']):
        access_token = create_access_token(identity=data['username'])
        return jsonify(access_token=access_token), 200
    return jsonify({"message": "Invalid username or password"}), 401

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

    new_id = data.get('id')
    if not new_id:
        new_id = int(time.time() * 1000)

    new_item = {
        "id": new_id,
        "username": current_user,
        "title": data['title'],
        "category": data['category'],
        "status": data['status'],
        "rating": data.get('rating', 0),
        "link": data.get('link', ''),
        "review": data.get('review', ''),
        "current_progress": data.get('current_progress', 0),
        "total_count": data.get('total_count', 0),
        "cover_image": data.get('cover_image', ''),
        "tags": data.get('tags', ''),
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
    return jsonify({"message": f"Deleted {result.deleted_count} items", "deleted_ids": ids_to_delete}), 200