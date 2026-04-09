// ─── Chat System ───

let chatOpen = false;
let unreadCount = 0;

function showChatButton() {
  document.getElementById('chat-toggle').style.display = 'flex';
}

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chat-panel');
  const toggle = document.getElementById('chat-toggle');
  panel.classList.toggle('open', chatOpen);

  if (chatOpen) {
    unreadCount = 0;
    updateBadge();
    toggle.classList.remove('has-new');
    document.getElementById('chat-input').focus();
    scrollChat();
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat', { message: text });
  input.value = '';
  input.focus();
}

document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

function addChatMessage(data, isSystem = false) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg' + (isSystem ? ' system' : '');

  if (isSystem) {
    div.textContent = data.message;
  } else {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'chat-name';
    nameSpan.style.color = data.color;
    nameSpan.textContent = data.name + (data.id === myId ? ' (kamu)' : '') + ':';
    div.appendChild(nameSpan);
    div.appendChild(document.createTextNode(' ' + data.message));
  }

  container.appendChild(div);
  scrollChat();

  if (!chatOpen && !isSystem) {
    unreadCount++;
    updateBadge();
    document.getElementById('chat-toggle').classList.add('has-new');
  }
}

function scrollChat() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function updateBadge() {
  const badge = document.getElementById('chatBadge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}
