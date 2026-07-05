from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app import db
from app.models import Task

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/')
def view_tasks():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    tasks = Task.query.filter_by(user_id=session['user_id']).all()
    return render_template('tasks.html', tasks=tasks)

@tasks_bp.route('/add', methods=["POST"])
def add_task():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    title = request.form.get('title')
    if title:
        new_task = Task(title=title, status="Pending", user_id=session['user_id'])
        db.session.add(new_task)
        db.session.commit()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(id=new_task.id, title=new_task.title, status=new_task.status)
        flash("Task added successfully", 'success')

    return redirect(url_for('tasks.view_tasks'))
        
@tasks_bp.route('/toggle/<int:task_id>', methods=["POST"])
def toggle_status(task_id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    task = Task.query.filter_by(id=task_id, user_id=session['user_id']).first()
    if task:
        if task.status == "Pending":
            task.status = 'Working'
        elif task.status == 'Working':
            task.status = 'Done'
        else:
            task.status = 'Pending'
        db.session.commit()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(id=task.id, status=task.status)
    return redirect(url_for('tasks.view_tasks'))

@tasks_bp.route('/clear', methods=['POST'])
def clear_tasks():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    Task.query.filter_by(user_id=session['user_id']).delete()
    db.session.commit()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(cleared=True)
    flash("All tasks cleared", 'info')
    return redirect(url_for('tasks.view_tasks'))

@tasks_bp.route('/delete/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    task = Task.query.filter_by(id=task_id, user_id=session['user_id']).first()

    if task:
        db.session.delete(task)
        db.session.commit()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(id=task_id)
        flash('Task deleted successfully', 'danger')
    else:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(error='Task not found'), 404
        flash("Task not found", "warning")

    return redirect(url_for('tasks.view_tasks'))