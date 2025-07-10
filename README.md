# Tutasks [https://tutasks.com](https://tutasks.com) - Task Management with Google Sheets

This is a Next.js project that integrates with Google Sheets for task management.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/tutasks2.git
    cd tutasks2
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of your project and add the following environment variables:

    ```
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
    ```

    -   `NEXTAUTH_SECRET`: You can generate a strong secret using `openssl rand -base64 32`.

4.  **Obtain Google API Credentials:**

    To get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, you need to set up a project in the Google Cloud Console and enable the Google Sheets API and Google Drive API.

    a.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
    b.  Create a new project or select an existing one.
    c.  Navigate to "APIs & Services" > "Credentials".
    d.  Click "Create Credentials" > "OAuth client ID".
    e.  Choose "Web application" as the Application type.
    f.  Configure the OAuth consent screen if you haven't already.
    g.  Add the following to "Authorized JavaScript origins":
        -   `http://localhost:3000` (for local development)
        -   Your production URL (e.g., `https://your-app.com`)
    h.  Add the following to "Authorized redirect URIs":
        -   `http://localhost:3000/api/auth/callback/google` (for local development)
        -   `https://your-app.com/api/auth/callback/google` (for production)
    i.  Click "Create". Your Client ID and Client Secret will be displayed.

    j.  **Enable APIs:**
        -   Go to "APIs & Services" > "Library".
        -   Search for "Google Sheets API" and enable it.
        -   Search for "Google Drive API" and enable it.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `src/app`: Contains the main application pages and layout.
-   `src/components`: Reusable React components.
-   `src/pages/api`: API routes for backend functionality, including NextAuth authentication and Google Sheets interactions.
