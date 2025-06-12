Starting a chat web app using AWS. Getting into cloud computing this summer.


Let me write some stuff down here or information.


Messages in chat are stored in Amazon DynamoDB.

@model directive was used in GraphQL schema, which instructs AWS Amplify to automatically provision a backend for this data type.


Amplify translates the @ model directive for the Message type into a dedicated Amazon DynamoDB table. 
Each field in the Message type (id, content, sender, createdAt), corresponds to an attribute in this DynamoDB table.
DyanmoDB itself is a NoSQL database service that provides fast and flexible data storage.

Amplify also words with AppSync API, which is a manage GraphQL service.
AppSync acts as the intermediary between your client application and the DynamoDB table. 
It uses resolvers (functions that connect GraphQL operations to data sources) to read from and write to the DynamoDB table that stores your messages.
When your app sends a GraphQL mutation to create a message or a query to fetch messages, AppSync processes these requests and interacts with DynamoDB.

