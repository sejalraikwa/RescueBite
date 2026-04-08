import streamlit as st
import pandas as pd
from utils import create_connection, create_table
from auth import create_user_table, add_user, login_user

st.markdown("""
    <style>
    .main {
        background-color: #f5f7fa;
    }
    .stButton>button {
        background-color: #ff4b4b;
        color: white;
        border-radius: 10px;
    }
    </style>
""", unsafe_allow_html=True)

st.markdown("## 🍲 RESCUEBITE")
st.markdown("### *Saving food. Feeding lives.* ❤️")

create_user_table()

if "user" not in st.session_state:
    st.session_state.user = None

menu = st.sidebar.selectbox("Menu", ["Login", "Signup"])

if menu == "Signup":
    st.subheader("Create Account")
    user = st.text_input("Username")
    pwd = st.text_input("Password", type="password")
    role = st.selectbox("Role", ["Donor", "NGO"])

    if st.button("Signup"):
        add_user(user, pwd, role)
        st.success("Account created!")

elif menu == "Login":
    st.subheader("Login")
    user = st.text_input("Username")
    pwd = st.text_input("Password", type="password")

    if st.button("Login"):
        result = login_user(user, pwd)
        if result:
            st.session_state.user = result
            st.success("Logged in!")
        else:
            st.error("Invalid credentials")

if st.session_state.user:
    role = st.session_state.user[3]

    if role == "Donor":
        st.info("You can donate food")

    elif role == "NGO":
        st.info("You can claim food")

city = st.text_input("Enter your city")

if city:
    df = df[df["location"].str.contains(city, case=False)]

# Setup
st.set_page_config(page_title="RESCUEBITE", layout="wide")
create_table()

st.title("🍲 RESCUEBITE")
st.subheader("Connecting Food Donors with NGOs")

menu = st.sidebar.selectbox("Menu", ["Donate Food", "View Donations", "Dashboard"])

# ---------------- DONATE FOOD ----------------
if menu == "Donate Food":
    st.header("🍽️ Donate Food")

    food = st.text_input("Food Item")
    qty = st.text_input("Quantity")
    loc = st.text_input("Location")
    contact = st.text_input("Contact Info")

    if st.button("Submit Donation"):
        if food and qty and loc and contact:
            conn = create_connection()
            c = conn.cursor()
            c.execute(
                "INSERT INTO donations (food, quantity, location, contact, status) VALUES (?, ?, ?, ?, ?)",
                (food, qty, loc, contact, "Available")
            )
            conn.commit()
            conn.close()
            st.success("✅ Donation posted successfully!")
        else:
            st.warning("⚠️ Please fill all fields")

# ---------------- VIEW DONATIONS ----------------
elif menu == "View Donations":
    st.header("📋 Available Donations")

city = st.text_input("Enter your city")

if city:
    df = df[df["location"].str.contains(city, case=False)]

    conn = create_connection()
    df = pd.read_sql("SELECT * FROM donations", conn)

    if df.empty:
        st.info("No donations yet.")
    else:
        for i, row in df.iterrows():
            col1, col2 = st.columns([3,1])

            with col1:
                st.write(f"🍛 **{row['food']}**")
                st.write(f"📦 Quantity: {row['quantity']}")
                st.write(f"📍 Location: {row['location']}")
                st.write(f"📞 Contact: {row['contact']}")
                st.write(f"Status: {row['status']}")

            with col2:
                if row["status"] == "Available":
                    if st.button(f"Claim #{row['id']}"):
                        c = conn.cursor()
                        c.execute("UPDATE donations SET status='Claimed' WHERE id=?", (row["id"],))
                        conn.commit()
                        st.success("🎉 Claimed!")

            st.markdown("---")

# ---------------- DASHBOARD ----------------
elif menu == "Dashboard":
    st.header("📊 Impact Dashboard")

    conn = create_connection()
    df = pd.read_sql("SELECT * FROM donations", conn)

    total = len(df)
    claimed = len(df[df["status"] == "Claimed"])

    st.metric("Total Donations", total)
    st.metric("Food Claimed", claimed)
    st.metric("Meals Saved (est.)", total * 5)

    if not df.empty:
        st.bar_chart(df["status"].value_counts())