from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import uuid
import base64

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'couple-special-secret-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///couple.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

db = SQLAlchemy(app)

# ── MODELS ──────────────────────────────────────────────

class CoupleProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name1 = db.Column(db.String(100), default='Aakash')
    name2 = db.Column(db.String(100), default='Nikita')
    together_since = db.Column(db.String(20), default='2023-02-14')
    profile_photo = db.Column(db.Text, nullable=True)
    love_letter = db.Column(db.Text, default='Every day with you feels like a beautiful dream...')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Photo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    caption = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tag = db.Column(db.String(50), default='special')
    filename = db.Column(db.String(300), nullable=True)
    emoji = db.Column(db.String(10), default='📸')
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Memory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    emoji = db.Column(db.String(10), default='💝')
    title = db.Column(db.String(200), nullable=False)
    text = db.Column(db.Text, nullable=False)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TimelineEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    emoji = db.Column(db.String(10), default='⭐')
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_date = db.Column(db.String(50), nullable=False)
    order = db.Column(db.Integer, default=0)

class SurpriseMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(100), default="Someone ❤️")

# ── HELPERS ─────────────────────────────────────────────

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def seed_defaults():
    if CoupleProfile.query.first() is None:
        db.session.add(CoupleProfile())

    if TimelineEvent.query.count() == 0:
        events = [
            TimelineEvent(emoji='👀', title='First Saw You', description="Couldn't stop looking...", event_date='Jan 2023', order=1),
            TimelineEvent(emoji='💬', title='First Chat', description="Our first 'Hi' turned into hours of talking", event_date='Feb 2023', order=2),
            TimelineEvent(emoji='☕', title='First Date', description='Coffee, nervousness, and butterflies', event_date='Mar 2023', order=3),
            TimelineEvent(emoji='🤝', title='Made It Official', description='The day we became us', event_date='Apr 2023', order=4),
            TimelineEvent(emoji='💑', title='First Trip Together', description='Adventures are better with you', event_date='Dec 2023', order=5),
            TimelineEvent(emoji='🌟', title='Future Dreams', description='So many beautiful chapters ahead...', event_date='Forever', order=6),
        ]
        db.session.add_all(events)

    if Memory.query.count() == 0:
        memories = [
            Memory(emoji='🌅', title='Sunset Together', text='That evening when time stood still', likes=5),
            Memory(emoji='🎂', title='Birthday Surprise', text='You made it magical', likes=8),
            Memory(emoji='🌧️', title='Dancing in Rain', text='Best spontaneous moment ever', likes=6),
            Memory(emoji='🎬', title='Movie Marathon', text='Blankets, popcorn, and you', likes=4),
        ]
        db.session.add_all(memories)

    if Photo.query.count() == 0:
        photos = [
            Photo(emoji='🌅', caption='Sunset Together', description='That evening when time stood still', tag='special', likes=3),
            Photo(emoji='☕', caption='First Date', description='Coffee, nervousness, and butterflies', tag='date', likes=7),
            Photo(emoji='✈️', caption='Goa Trip', description='Our first vacation together', tag='travel', likes=9),
            Photo(emoji='🎂', caption='Birthday Surprise', description='You made it absolutely magical', tag='special', likes=5),
        ]
        db.session.add_all(photos)

    if SurpriseMessage.query.count() == 0:
        msgs = [
            SurpriseMessage(message="You are the reason I believe in love. Every moment with you is a treasure I hold close to my heart. 💕"),
            SurpriseMessage(message="Your smile lights up every room. I fall in love with you more each day. 🌹"),
            SurpriseMessage(message="You make my heart skip a beat, my soul sing, and my world brighter just by being in it. ✨"),
            SurpriseMessage(message="Every love story is beautiful, but ours is my favorite. 💑"),
            SurpriseMessage(message="In a sea of people, my eyes will always search for you. 🌊💫"),
            SurpriseMessage(message="Thank you for the cuddles, laughter, and the love that grows stronger every day. 🌸"),
        ]
        db.session.add_all(msgs)

    db.session.commit()

# ── ROUTES ──────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

# Profile
@app.route('/api/profile', methods=['GET'])
def get_profile():
    p = CoupleProfile.query.first()
    return jsonify({
        'name1': p.name1, 'name2': p.name2,
        'together_since': p.together_since,
        'profile_photo': p.profile_photo,
        'love_letter': p.love_letter
    })

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    p = CoupleProfile.query.first()
    data = request.get_json()
    if 'name1' in data: p.name1 = data['name1']
    if 'name2' in data: p.name2 = data['name2']
    if 'together_since' in data: p.together_since = data['together_since']
    if 'profile_photo' in data: p.profile_photo = data['profile_photo']
    if 'love_letter' in data: p.love_letter = data['love_letter']
    db.session.commit()
    return jsonify({'status': 'ok'})

# Photos
@app.route('/api/photos', methods=['GET'])
def get_photos():
    tag = request.args.get('tag')
    q = Photo.query
    if tag and tag != 'all':
        q = q.filter_by(tag=tag)
    photos = q.order_by(Photo.created_at.desc()).all()
    return jsonify([{
        'id': p.id, 'caption': p.caption, 'description': p.description,
        'tag': p.tag, 'emoji': p.emoji, 'likes': p.likes,
        'filename': p.filename,
        'url': f'/static/uploads/{p.filename}' if p.filename else None,
        'created_at': p.created_at.isoformat()
    } for p in photos])

@app.route('/api/photos', methods=['POST'])
def add_photo():
    caption = request.form.get('caption', 'New Memory')
    description = request.form.get('description', '')
    tag = request.form.get('tag', 'special')
    emoji_map = {'date': '💑', 'travel': '✈️', 'fun': '😄', 'special': '⭐'}
    emoji = emoji_map.get(tag, '📸')
    filename = None

    if 'photo' in request.files:
        file = request.files['photo']
        if file and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    photo = Photo(caption=caption, description=description, tag=tag, emoji=emoji, filename=filename)
    db.session.add(photo)
    db.session.commit()
    return jsonify({'status': 'ok', 'id': photo.id})

@app.route('/api/photos/<int:photo_id>/like', methods=['POST'])
def like_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)
    photo.likes += 1
    db.session.commit()
    return jsonify({'likes': photo.likes})

@app.route('/api/photos/<int:photo_id>', methods=['DELETE'])
def delete_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)
    if photo.filename:
        path = os.path.join(app.config['UPLOAD_FOLDER'], photo.filename)
        if os.path.exists(path):
            os.remove(path)
    db.session.delete(photo)
    db.session.commit()
    return jsonify({'status': 'deleted'})

# Memories
@app.route('/api/memories', methods=['GET'])
def get_memories():
    memories = Memory.query.order_by(Memory.created_at.desc()).all()
    return jsonify([{
        'id': m.id, 'emoji': m.emoji, 'title': m.title,
        'text': m.text, 'likes': m.likes,
        'created_at': m.created_at.isoformat()
    } for m in memories])

@app.route('/api/memories', methods=['POST'])
def add_memory():
    data = request.get_json()
    m = Memory(
        emoji=data.get('emoji', '💝'),
        title=data.get('title', 'New Memory'),
        text=data.get('text', 'A beautiful moment...')
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'status': 'ok', 'id': m.id})

@app.route('/api/memories/<int:mem_id>/like', methods=['POST'])
def like_memory(mem_id):
    m = Memory.query.get_or_404(mem_id)
    m.likes += 1
    db.session.commit()
    return jsonify({'likes': m.likes})

@app.route('/api/memories/<int:mem_id>', methods=['DELETE'])
def delete_memory(mem_id):
    m = Memory.query.get_or_404(mem_id)
    db.session.delete(m)
    db.session.commit()
    return jsonify({'status': 'deleted'})

# Timeline
@app.route('/api/timeline', methods=['GET'])
def get_timeline():
    events = TimelineEvent.query.order_by(TimelineEvent.order).all()
    return jsonify([{
        'id': e.id, 'emoji': e.emoji, 'title': e.title,
        'description': e.description, 'event_date': e.event_date, 'order': e.order
    } for e in events])

@app.route('/api/timeline', methods=['POST'])
def add_timeline_event():
    data = request.get_json()
    max_order = db.session.query(db.func.max(TimelineEvent.order)).scalar() or 0
    e = TimelineEvent(
        emoji=data.get('emoji', '⭐'),
        title=data.get('title', 'New Event'),
        description=data.get('description', ''),
        event_date=data.get('event_date', ''),
        order=max_order + 1
    )
    db.session.add(e)
    db.session.commit()
    return jsonify({'status': 'ok', 'id': e.id})

# Surprise messages
@app.route('/api/surprise', methods=['GET'])
def get_surprise():
    import random
    msgs = SurpriseMessage.query.all()
    if not msgs:
        return jsonify({'message': 'You are my everything! ❤️'})
    msg = random.choice(msgs)
    return jsonify({'message': msg.message})

@app.route('/api/surprise', methods=['POST'])
def add_surprise():
    data = request.get_json()

    s = SurpriseMessage(
        message=data.get("message"),
        sender=data.get("sender", "Someone ❤️")
    )

    db.session.add(s)
    db.session.commit()

    return jsonify({"status":"ok"})

# Serve uploaded files
@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ── INIT & RUN ───────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_defaults()
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5011)