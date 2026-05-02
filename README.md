Task Management System (Role-Based)
Overview

This is a full-stack task management web application where users can create projects, manage teams, assign tasks, and track progress. The system is built with role-based access control, supporting Admin, Manager, and Team Member roles.

Features
Authentication
User registration and login
Role-based access control (Admin, Manager, Team Member)
Roles and Functionalities
Admin
Create and manage account through registration
Create team structure:
Add Managers
Add Team Members (Employees)
Assign team members under specific managers
Create projects
Assign projects to managers
View all teams and hierarchy
Manager
Access dashboard with detailed metrics:
Total tasks
Tasks in To Do, In Progress, Review, Completed
Overdue tasks
Team size
View recent tasks
Create tasks:
Assign tasks to self or team members
Set deadlines
Monitor task progress
Access task board (Kanban view)
Team Member (Employee)
View assigned tasks
Start and stop task timer
Track time spent on each task
Update task status
Add description of completed work
Access personal dashboard
Task Management
Create and assign tasks
Track task status:
To Do
In Progress
Review
Completed
Time tracking functionality
Add completion notes
Identify overdue tasks
Dashboard
Role-based dashboards
Overview of task statistics
Display of recent tasks
Performance tracking
Technical Implementation
Backend
REST API architecture
Proper validations and error handling
Role-based access control (RBAC)
Structured data relationships
Frontend
User-friendly interface
Dashboard and task board UI
Responsive design
Database
SQL or NoSQL database
Relationship management between users, tasks, and projects
Tech Stack
Frontend: React / HTML / CSS / Tailwind
Backend: Node.js / Express
Database: SQL / NoSQL
Version Control: Git
Setup Instructions
# Clone the repository
git clone <repository-link>

# Install dependencies
npm install

# Run the application
npm start
Project Objective

The goal of this project is to build a scalable task management system that demonstrates:

Role-based system design
Team and project management
Task tracking and time tracking
Real-world workflow implementation
Future Improvements
Notification system
Real-time updates
File attachments in tasks
Advanced analytics dashboard
