import { useEffect, useState } from 'react';
import { Navbar, NavbarBrand, UncontrolledTooltip } from 'reactstrap';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { DefaultEditor } from 'react-simple-wysiwyg';
import Avatar from 'react-avatar';

import './App.css';
import useAuth from './useAuth';

export const getSocketUrl = (): string => {
  if (process.env.NODE_ENV === 'development')
    return process.env.REACT_APP_SOCKET_URL_DEV ?? '';
  return process.env.REACT_APP_SOCKET_URL_PROD ?? '';
};

function isUserEvent(message: any): boolean {
  const evt = JSON.parse(message.data);
  return evt.type === 'userevent';
}

function isDocumentEvent(message: any) {
  const evt = JSON.parse(message.data);
  return evt.type === 'contentchange';
}

function App({ code }: { code: string }) {
  const accessToken = useAuth(code);

  console.log(process.env);

  const [username, setUsername] = useState('');
  const { sendJsonMessage, readyState } = useWebSocket(getSocketUrl(), {
    onOpen: () => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username,
        type: 'userevent',
      });
    }
  }, [username, sendJsonMessage, readyState]);

  return (
    <>
      <Navbar color="light" light>
        <NavbarBrand href="/">Real-time document editor</NavbarBrand>
      </Navbar>
      <div className="container-fluid">
        {username ? <EditorSection /> : <LoginSection onLogin={setUsername} />}
      </div>
    </>
  );
}

function LoginSection({ onLogin }: any) {
  const [username, setUsername] = useState('');
  useWebSocket(getSocketUrl(), {
    share: true,
    filter: () => false,
  });
  function logInUser() {
    if (!username.trim()) {
      return;
    }
    onLogin && onLogin(username);
  }

  return (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <p className="account__name">Hello, user!</p>
            <p className="account__sub">Join to edit the document</p>
          </div>
          <input
            name="username"
            onInput={(e) => setUsername(e.currentTarget.value)}
            className="form-control"
          />
          <button
            type="button"
            onClick={() => logInUser()}
            className="btn btn-primary account__btn"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

function History() {
  console.log('history');
  const { lastJsonMessage } = useWebSocket(getSocketUrl(), {
    share: true,
    filter: isUserEvent,
  });
  const activities = (lastJsonMessage as any)?.data.userActivity || [];
  return (
    <ul>
      {activities.map((activity: any, index: any) => (
        <li key={`activity-${index}`}>{activity}</li>
      ))}
    </ul>
  );
}

function Users() {
  const { lastJsonMessage } = useWebSocket(getSocketUrl(), {
    share: true,
    filter: isUserEvent,
  });
  const users = Object.values((lastJsonMessage as any)?.data.users || {});
  return (
    <div>
      {users.map((user: any) => (
        <div key={user.username}>
          <span id={user.username} className="userInfo" key={user.username}>
            <Avatar name={user.username} size={'40'} round="20px" />
          </span>
          <UncontrolledTooltip placement="top" target={user.username}>
            {user.username}
          </UncontrolledTooltip>
        </div>
      ))}
    </div>
  );
}

function EditorSection() {
  return (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          <Users />
        </div>
        <Document />
      </div>
      <div className="history-holder">
        <History />
      </div>
    </div>
  );
}

function Document() {
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(getSocketUrl(), {
    share: true,
    filter: isDocumentEvent,
  });

  let html = (lastJsonMessage as any)?.data.editorContent || '';

  function handleHtmlChange(e: any) {
    sendJsonMessage({
      type: 'contentchange',
      content: e.target.value,
    });
  }

  return <DefaultEditor value={html} onChange={handleHtmlChange} />;
}

export default App;
