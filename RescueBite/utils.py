import sqlite3

def create_connection():
    conn = sqlite3.connect("database.db", check_same_thread=False)
    return conn

def create_table():
    conn = create_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food TEXT,
            quantity TEXT,
            location TEXT,
            contact TEXT,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()