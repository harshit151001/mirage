### 1. **Query Chat API**
   - **Endpoint:** `/query`
   - **Method:** `POST`
   - **Params (Request Body):**
     - `chatId` (string) - The ID of the chat.
     - `repoId` (string) - The ID of the repository.
     - `message` (string) - The user message content.
     - `parentId` (string) - (Optional) The ID of the parent message, if any.
   - **Returns:**
     - Starts a stream response.
     - **In progress:** Returns event data of the stream as it progresses (`status: in_progress`).
     - **Completed:** Returns the final chat message and stores it with `status: completed`.

---

### 2. **Get Chats History API**
   - **Endpoint:** `/chats-history`
   - **Method:** `GET`
   - **Params:** None
   - **Returns:** 
     - **200 OK:**
       - A list of chat histories for the user.
       ```json
       [
         {
           "id": "chatId",
           "repoId": {
             "id": "repoId",
             "name": "repoName",
             "owner": "repoOwner"
           },
           "messages": [
             {
               "id": "messageId",
               "content": "messageContent",
               "senderType": "user/assistant",
               "parentId": "parentId",
               "createdAt": "timestamp"
             }
           ]
         }
       ]
       ```
     - **500 Internal Server Error:** If fetching the chat history fails.

---

### 3. **Get Chat History API**
   - **Endpoint:** `/chat-history/:chatId`
   - **Method:** `GET`
   - **Params (URL):**
     - `chatId` (string) - The ID of the specific chat.
   - **Returns:**
     - **200 OK:**
       - Detailed history of the specified chat, including all messages.
       ```json
       {
         "id": "chatId",
         "repo": {
           "id": "repoId",
           "name": "repoName",
           "owner": "repoOwner"
         },
         "messages": [
           {
             "id": "messageId",
             "content": "messageContent",
             "senderType": "user/assistant",
             "parentId": "parentId",
             "createdAt": "timestamp"
           }
         ]
       }
       ```
     - **404 Not Found:** If chat is not found.
     - **500 Internal Server Error:** If fetching the chat history fails.

---

### 4. **Get User Repositories API**
   - **Endpoint:** `/user-repos`
   - **Method:** `GET`
   - **Params:** None
   - **Requires:** GitHub access token in the request.
   - **Returns:**
     - **200 OK:**
       - A list of all user repositories (including organizational ones).
       ```json
       [
         {
           "id": "repoId",
           "name": "repoName",
           "owner": "repoOwner",
           "createdAt": "creationDate",
           "updatedAt": "lastUpdatedDate"
         }
       ]
       ```
     - **500 Internal Server Error:** If fetching the repositories fails.

---

### 5. **Process Repository API**
   - **Endpoint:** `/process-repo/:owner/:repo`
   - **Method:** `POST`
   - **Params (URL):**
     - `owner` (string) - The owner of the repository.
     - `repo` (string) - The name of the repository.
   - **Requires:** GitHub access token in the request.
   - **Returns:**
     - **201 Created:**
       - Successfully processes the repository and returns repository data.
       ```json
       {
         "id": "repoId",
         "name": "repoName",
         "owner": "repoOwner",
         "createdAt": "creationDate",
         "updatedAt": "lastUpdatedDate"
       }
       ```
     - **409 Conflict:** If the repository already exists.
     - **500 Internal Server Error:** If processing the repository fails.

---

### 6. **Get Processed Repositories API**
   - **Endpoint:** `/processed-repos`
   - **Method:** `GET`
   - **Params:** None
   - **Returns:**
     - **200 OK:**
       - A list of all processed repositories for the user.
       ```json
       [
         {
           "id": "repoId",
           "name": "repoName",
           "owner": "repoOwner",
           "createdAt": "creationDate",
           "updatedAt": "lastUpdatedDate"
         }
       ]
       ```
     - **500 Internal Server Error:** If fetching the processed repositories fails.

---

