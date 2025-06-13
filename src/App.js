// filepath: src/App.js
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify'; // Changed to named import
import { DataStore } from '@aws-amplify/datastore'; // Import DataStore from its own package
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './models/App.css';

import { Message } from './models'; // Import the Message model

import awsExports from './aws-exports';
Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');

  // useEffect will fetch initial messages when component mounts, and set up the GraphQL subscription to onCreateMessage.
  // When a new message is created, it will be added to the messages state.
  // The subscription is cleaned up when the component unmounts to prevent memory leaks.
  useEffect(() => {
    fetchMessages();

    const subscription = DataStore.observe(Message).subscribe(msg => {
      console.log('DataStore observation:', msg);
      if (msg.opType === 'INSERT') {
        setMessages((prevMessages) => [...prevMessages, msg.element]);
      }
      // Might add UPDATE and DELETE handling in the future, idk.
    });

    return () => subscription.unsubscribe();
  }, []);

  // An async function to get existing messages using API.graphql with the listMessages query.
  const fetchMessages = async () => {
    try {
      // Query messages from the DataStore
      const fetchedMessages = await DataStore.query(Message);
      setMessages(fetchedMessages);
    }
    catch (err) {
      console.log('error fetching messages:', err);
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
    <div className="AppContainer"> {/* Added AppContainer */}
      <div className="UserInfo"> {/* Added UserInfo wrapper */}
        Hello, {user.username}
        <button onClick={signOut} className="SignOutButton">Sign Out</button>
      </div>
      <h1 className="Title">Miscord</h1> {/* Changed class to className */}


      <div className="MessageList"> {/* Changed style to className */}
        {messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((msg) => (
          <div key={msg.id} className="MessageItem"> {/* Added MessageItem className */}
            <strong>{msg.sender}:</strong> {msg.content} <em>({new Date(msg.createdAt).toLocaleTimeString()})</em>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="MessageForm"> {/* Added MessageForm className */}
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="> type your message..." // Hacker-ish placeholder
          className="MessageInput" // Added MessageInput className
        />
        <button type="submit" className="SendMessageButton">Send</button>
      </form>
    </div>
  );
}

export default withAuthenticator(App);