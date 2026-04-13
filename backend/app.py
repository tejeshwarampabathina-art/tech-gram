from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app) 

# ==========================================
# LOCAL HOST CONFIGURATION
# ==========================================
basedir = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'techgram_v5.db') # Evolved tracking isolated usernames specifically
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)


def build_file_url(filename):
    return f"{request.url_root.rstrip('/')}/uploads/{filename}"

@app.route('/')
def home():
    return "🚀 Techgram Backend Gateway is LIVE and structurally secure natively."


# ==========================================
# SECURITY MODELS V5 (Usernames logic)
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    auth_id = db.Column(db.String(120), unique=True, nullable=False) 
    username = db.Column(db.String(100), unique=True, nullable=False) # Natively uniquely verified identity parameter
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class OTPToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    auth_id = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False) 
    details = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.String(500), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=False)
    contact_email = db.Column(db.String(120), nullable=False) 
    github_link = db.Column(db.String(255), nullable=True)
    preview_link = db.Column(db.String(255), nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    model_3d_url = db.Column(db.String(255), nullable=True)
    owner_username = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'category': self.category,
            'details': self.details, 'media_url': self.media_url,
            'contact_phone': self.contact_phone, 'contact_email': self.contact_email,
            'owner_username': self.owner_username or "Engineering Pioneer",
            'github_link': self.github_link, 'preview_link': self.preview_link,
            'video_url': self.video_url, 'model_3d_url': self.model_3d_url,
            'created_at': self.created_at
        }

class DirectMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_auth = db.Column(db.String(150), nullable=False)
    sender_username = db.Column(db.String(100), nullable=True)
    recipient_auth = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "sender_auth": self.sender_auth, 
            "sender_username": self.sender_username,
            "recipient_auth": self.recipient_auth, "content": self.content, 
            "timestamp": self.timestamp.isoformat()
        }

class CommunityMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    community_name = db.Column(db.String(100), nullable=False)
    sender_auth = db.Column(db.String(150), nullable=False)
    sender_username = db.Column(db.String(100), nullable=True)
    content = db.Column(db.Text, nullable=False)
    is_post = db.Column(db.Boolean, default=False)
    media_url = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id, "community_name": self.community_name, 
            "sender_auth": self.sender_auth, "sender_username": self.sender_username,
            "content": self.content, "is_post": self.is_post, "media_url": self.media_url,
            "timestamp": self.timestamp.isoformat()
        }

class TechCommunity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    admin_auth = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return { 'id': self.id, 'name': self.name, 'admin_auth': self.admin_auth }

class InteractionRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False) 
    sender_auth = db.Column(db.String(120), nullable=False)
    recipient_auth = db.Column(db.String(120), nullable=False)
    target_name = db.Column(db.String(100), nullable=False) 
    status = db.Column(db.String(20), default='pending') 

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'type': self.type, 'sender_auth': self.sender_auth,
            'recipient_auth': self.recipient_auth, 'target_name': self.target_name,
            'status': self.status, 'created_at': self.created_at.isoformat() if self.created_at else ''
        }

with app.app_context():
    db.create_all()
    if not TechCommunity.query.first():
        db.session.add(TechCommunity(name="Python AI Robotics", admin_auth="system@techgram.admin"))
        db.session.add(TechCommunity(name="Global SpaceX Thrusters", admin_auth="system@techgram.admin"))
        db.session.commit()

# ==========================================
# AUTHENTICATION ENDPOINTS WITH USERNAME
# ==========================================
@app.route('/api/request-otp', methods=['POST'])
def generate_otp():
    data = request.get_json()
    auth_id = data.get('auth_id')
    username = data.get('username')

    if not auth_id: return jsonify({"message": "Email or Phone parameter explicitly required natively."}), 400
    if '@' in auth_id and not auth_id.lower().endswith('@gmail.com'):
        return jsonify({"message": "Access Denied: System security strictly natively requires an official Gmail account (@gmail.com)."}), 403
            
    existing_user = User.query.filter_by(auth_id=auth_id).first()
    if not existing_user:
        if not username:
            return jsonify({"message": "A strict unique public @username is explicitly required natively for initial configurations."}), 400
        # Check against global collisions securely implicitly natively 
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Architecture Denied: That specific @username is already actively mathematically securely registered."}), 409

    otp_code = str(random.randint(100000, 999999))
    expiration = datetime.now() + timedelta(minutes=5) 
    
    new_token = OTPToken(auth_id=auth_id, code=otp_code, expires_at=expiration)
    db.session.add(new_token)
    db.session.commit()
    
    return jsonify({ "message": "Authentication Protocol generated.", "dev_code": otp_code }), 200

@app.route('/api/verify-otp', methods=['POST'])
def securely_verify_otp():
    data = request.get_json()
    auth_id = data.get('auth_id')
    otp_code = data.get('otp')
    requested_username = data.get('username')
    
    token_record = OTPToken.query.filter_by(auth_id=auth_id, code=otp_code, is_used=False).order_by(OTPToken.id.desc()).first()
    if token_record and token_record.expires_at > datetime.now():
        token_record.is_used = True 
        user = User.query.filter_by(auth_id=auth_id).first()
        if not user:
            user = User(auth_id=auth_id, username=requested_username)
            db.session.add(user)
        db.session.commit()
        return jsonify({ "message": "Protocol accepted.", "session_user_id": user.id, "username": user.username }), 200
        
    return jsonify({"message": "Authentication failed natively securely."}), 401

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/search/users', methods=['GET'])
def search_users():
    q = request.args.get('q', '').strip().lower()
    if not q or len(q) < 1:
        return jsonify([]), 200
    # Search by username or auth_id (email/phone)
    results = User.query.filter(
        db.or_(
            User.username.ilike(f'%{q}%'),
            User.auth_id.ilike(f'%{q}%')
        )
    ).limit(20).all()
    return jsonify([{'auth_id': u.auth_id, 'username': u.username} for u in results]), 200

# ==========================================
# PROJECT ENDPOINTS
# ==========================================
@app.route('/api/projects', methods=['GET', 'POST'])
def handle_projects():
    if request.method == 'POST':
        form_data = request.form
        mediaUrl = ""
        file = request.files.get('mediaFile')
        if file and file.filename != '':
            filename = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            mediaUrl = build_file_url(filename)
        
        # Fetch username for display anonymity
        user = User.query.filter_by(auth_id=form_data.get('contactEmail')).first()
        owner_username = user.username if user else "Engineering Pioneer"

        try:
            new_project = Project(
                title=form_data.get('title'), category=form_data.get('category'), details=form_data.get('details'),
                media_url=mediaUrl, contact_phone=form_data.get('contactPhone'), contact_email=form_data.get('contactEmail'),
                owner_username=owner_username,
                github_link=form_data.get('githubLink'), preview_link=form_data.get('previewLink'),
                video_url=form_data.get('videoUrl'), model_3d_url=form_data.get('model3dUrl')
            )
            db.session.add(new_project)
            db.session.commit()
            return jsonify({"message": "Deployment authenticated natively!", "project": new_project.to_dict()}), 201
        except Exception as e:
            return jsonify({"message": str(e)}), 400
    else:
        projects = Project.query.order_by(Project.created_at.desc()).all()
        return jsonify({"projects": [p.to_dict() for p in projects]}), 200

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def securely_nuke_project(project_id):
    project_deployment = Project.query.get(project_id)
    if not project_deployment: return jsonify({"message": "Anomaly."}), 404
        
    if project_deployment.media_url and '/uploads/' in project_deployment.media_url:
        target_file = project_deployment.media_url.split('/uploads/')[-1]
        native_path = os.path.join(app.config['UPLOAD_FOLDER'], target_file)
        if os.path.exists(native_path): os.remove(native_path)
            
    db.session.delete(project_deployment)
    db.session.commit()
    return jsonify({"message": "Erased natively comprehensively natively."}), 200

# ==========================================
# COMMUNITY NOTIFICATION LOGIC
# ==========================================
@app.route('/api/communities', methods=['GET', 'POST'])
def manage_communities():
    if request.method == 'POST':
        data = request.json
        c = TechCommunity(name=data['name'], admin_auth=data['admin_auth'])
        db.session.add(c)
        db.session.commit()
        return jsonify(c.to_dict()), 201
    return jsonify([c.to_dict() for c in TechCommunity.query.all()]), 200

@app.route('/api/communities/<int:comm_id>', methods=['DELETE'])
def destroy_community(comm_id):
    c = TechCommunity.query.get(comm_id)
    if c:
        db.session.delete(c)
        db.session.commit()
    return jsonify({"message": "Community permanently eradicated natively."}), 200

@app.route('/api/interactions', methods=['POST'])
def request_interaction():
    data = request.json
    status_val = data.get('status', 'pending')
    if data['type'] == 'follow_user':
        existing = InteractionRequest.query.filter_by(type='follow_user', sender_auth=data['sender_auth'], recipient_auth=data['recipient_auth']).first()
        if existing: return jsonify({"message": "Already securely tracking inherently."}), 200

    req = InteractionRequest(type=data['type'], sender_auth=data['sender_auth'], recipient_auth=data['recipient_auth'], target_name=data['target_name'], status=status_val)
    db.session.add(req)
    db.session.commit()
    return jsonify(req.to_dict()), 201

@app.route('/api/contacts/<auth_id>', methods=['GET'])
def get_contacts(auth_id):
    following = InteractionRequest.query.filter_by(type='follow_user', sender_auth=auth_id, status='accepted').all()
    followers = InteractionRequest.query.filter_by(type='follow_user', recipient_auth=auth_id, status='accepted').all()
    contacts = list(set([f.recipient_auth for f in following] + [f.sender_auth for f in followers]))
    return jsonify(contacts), 200

@app.route('/api/dm/<auth_1>/<auth_2>', methods=['GET'])
def get_dms(auth_1, auth_2):
    msgs = DirectMessage.query.filter(
        db.or_(
            db.and_(DirectMessage.sender_auth==auth_1, DirectMessage.recipient_auth==auth_2),
            db.and_(DirectMessage.sender_auth==auth_2, DirectMessage.recipient_auth==auth_1)
        )
    ).order_by(DirectMessage.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in msgs]), 200

@app.route('/api/dm', methods=['POST'])
def send_dm():
    data = request.json
    if not data or not data.get('sender_auth') or not data.get('recipient_auth') or not data.get('content'):
        return jsonify({'error': 'Missing fields'}), 400
    
    user = User.query.filter_by(auth_id=data['sender_auth']).first()
    sender_username = user.username if user else "Secure User"

    msg = DirectMessage(
        sender_auth=data['sender_auth'],
        sender_username=sender_username,
        recipient_auth=data['recipient_auth'],
        content=data['content']
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

@app.route('/api/user/<auth_id>/stats', methods=['GET'])
def get_user_stats(auth_id):
    followers = InteractionRequest.query.filter_by(type='follow_user', recipient_auth=auth_id, status='accepted').count()
    following = InteractionRequest.query.filter_by(type='follow_user', sender_auth=auth_id, status='accepted').count()
    return jsonify({"followers": followers, "following": following})

@app.route('/api/user/<auth_id>/memberships', methods=['GET'])
def get_user_memberships(auth_id):
    memberships = InteractionRequest.query.filter_by(type='join_community', sender_auth=auth_id, status='accepted').all()
    return jsonify({"communities": [m.target_name for m in memberships]})

@app.route('/api/community/<community_name>/feed', methods=['GET'])
def get_community_feed(community_name):
    msgs = CommunityMessage.query.filter_by(community_name=community_name).order_by(CommunityMessage.timestamp.desc()).all()
    return jsonify([m.to_dict() for m in msgs]), 200

@app.route('/api/community/<community_name>/message', methods=['POST'])
def post_community_message(community_name):
    data = request.json
    user = User.query.filter_by(auth_id=data['sender_auth']).first()
    sender_username = user.username if user else "Guild Member"

    msg = CommunityMessage(
        community_name=community_name, sender_auth=data['sender_auth'], 
        sender_username=sender_username,
        content=data['content'], is_post=False
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

@app.route('/api/community/<community_name>/post', methods=['POST'])
def post_community_deployment(community_name):
    sender_auth = request.form.get('auth_id')
    content = request.form.get('content')
    media_url = ""
    f = request.files.get('file')
    if f and f.filename != '':
        filename = secure_filename(f.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        f.save(path)
        media_url = build_file_url(filename)

    user = User.query.filter_by(auth_id=sender_auth).first()
    sender_username = user.username if user else "Guild Pioneer"

    msg = CommunityMessage(
        community_name=community_name, sender_auth=sender_auth, 
        sender_username=sender_username,
        content=content, is_post=True, media_url=media_url
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

@app.route('/api/interactions/<auth_id>', methods=['GET'])
def get_interactions(auth_id):
    reqs = InteractionRequest.query.filter_by(recipient_auth=auth_id, status='pending').order_by(InteractionRequest.id.desc()).all()
    return jsonify([r.to_dict() for r in reqs]), 200

@app.route('/api/interactions/<int:req_id>', methods=['PUT'])
def resolve_interaction(req_id):
    data = request.json
    req = InteractionRequest.query.get(req_id)
    if req:
        req.status = data.get('status')
        db.session.commit()
    return jsonify({"message": "Status updated natively."}), 200

if __name__ == '__main__':
    print("Python/SQL V5 Database utilizing explicit Usernames natively loaded.")
    print("Backend accessible on local network at http://10.0.4.45:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
