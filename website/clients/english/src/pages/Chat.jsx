import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { preloadResource } from '../../../shared/resource-cache.js';
import { useFocusMode } from '../../../shared/AppShell.jsx';
import { PipChat, chatKey, loadChatHistory } from '../../../shared/PipChat.jsx';

// Loads the conversation behind the sign-in splash when the tutor is the landing page.
export function preload({ userId }) {
  return preloadResource(chatKey('english', userId), () => loadChatHistory(api, 'english'));
}

// Ask Pip, full screen. The same conversation also opens as a sheet over
// lessons, questions and retries.
export default function Chat({ health, userId }) {
  useFocusMode(true);
  const navigate = useNavigate();
  return (
    <div className="page chat-page">
      <PipChat
        api={api}
        subject="english"
        userId={userId}
        health={health}
        variant="page"
        onBack={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
      />
    </div>
  );
}
