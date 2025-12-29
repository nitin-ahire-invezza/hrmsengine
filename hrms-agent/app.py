# app.py
import streamlit as st
from chat import qa_chain  # re-use chat.py's chain

st.title("🏢 Invezza Policies")

if "history" not in st.session_state:
    st.session_state.history = []

user_input = st.text_input("Ask about Invezza policies:")
if user_input:
    result = qa_chain.invoke({"query": user_input})
    st.session_state.history.append((user_input, result["result"]))
    
# Display conversation
for user_text, bot_text in st.session_state.history:
    st.markdown(f"**You:** {user_text}")
    st.markdown(f"**Invezza Bot:** {bot_text}")
