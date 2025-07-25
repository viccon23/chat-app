import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Hub } from '@aws-amplify/core';
import { DataStore } from '@aws-amplify/datastore';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './models/App.css';

import { Message } from './models';

import awsExports from './aws-exports';
Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // useEffect will fetch initial messages when component mounts, and set up the GraphQL subscription to onCreateMessage.
  // When a new message is created, it will be added to the messages state.
  // The subscription is cleaned up when the component unmounts to prevent memory leaks.
  useEffect(() => {
    // Listen to DataStore hub events for connection status
    const hubListener = Hub.listen('datastore', async (hubData) => {
      const { event } = hubData.payload;

      switch (event) {
        case 'ready':
          setConnectionStatus('Connected');
          console.log('DataStore is ready');
          break;
        case 'networkStatus':
          if (hubData.payload.active) {
            setConnectionStatus('Connected');
          } else {
            setConnectionStatus('OFFLINE');
          }
          break;
        case 'syncQueriesStarted':
          setConnectionStatus('Syncing...');
          break;
        case 'syncQueriesReady':
          setConnectionStatus('Connected');
          break;
        default:
          break;
      }
    });

    fetchMessages();

    const subscription = DataStore.observe(Message).subscribe(msg => {
      console.log('DataStore observation:', msg);
      if (msg.opType === 'INSERT') {
        setMessages((prevMessages) => [...prevMessages, msg.element]);
      }
      // Might add UPDATE and DELETE handling in the future, idk.
    });

    return () => {
      subscription.unsubscribe();
      hubListener();
    };
  }, []);

  // An async function to get existing messages using API.graphql with the listMessages query.
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      // Query messages from the DataStore
      const fetchedMessages = await DataStore.query(Message);
      setMessages(fetchedMessages);
    }
    catch (err) {
      console.log('error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // An async function to send a new message 
  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!messageContent.trim() || !user || !user.username) return;

    const input = {
      content: messageContent,
      sender: user.username, // or user.attributes.email, depending on your auth setup
      createdAt: new Date().toISOString(), // Done for DataStore (expects ISOString for AWSDateTime)
    };

    try {
      await DataStore.save(
        new Message({
          content: messageContent,
          sender: user.username,
          createdAt: new Date().toISOString(), // Ensure the date is in ISO format
        })
      );
      setMessageContent(''); // Clear the input field after sending
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="AppContainer">
      <div className="UserInfo">
        <div className="StatusIndicator">
          <span className={`status-dot ${connectionStatus.replace(/\./g, '').replace(' ', '-')}`}></span>
          <span className="status-text">{connectionStatus}</span>
        </div>
        <div className="UserGreeting">
          Hello, {user.username}
          <button onClick={signOut} className="SignOutButton">Sign Out</button>
        </div>
      </div>
      <h1 className="Title">Miscord</h1>


      <div className="MessageList">
        {isLoading ? (
          <div>Loading messages...</div>
        ) : (
          messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((msg) => (
            <div key={msg.id} className="MessageItem">
              <strong>{msg.sender}:</strong> {msg.content} <em>({new Date(msg.createdAt).toLocaleTimeString()})</em>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="MessageForm">
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="> type your message..." 
          className="MessageInput"
        />
        <button type="submit" className="SendMessageButton">Send</button>
      </form>
    </div>
  );
}

export default withAuthenticator(App);