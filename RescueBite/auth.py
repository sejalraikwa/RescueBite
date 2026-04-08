import sqlite3

def create_user_table():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            role TEXT
        )
    ''')
    conn.commit()
    conn.close()

def add_user(username, password, role):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              (username, password, role))
    conn.commit()
    conn.close()

def login_user(username, password):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND password=?",
              (username, password))
    data = c.fetchone()
    conn.close()
    return data