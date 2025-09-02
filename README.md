# Tutasks [https://tutasks.com](https://tutasks.com) - Task Management with Google Sheets & Microsoft Excel

This is a Next.js project that integrates with Google Sheets and Microsoft Excel Online for task management. Choose between Google Sheets or Excel workbooks to store and manage your tasks seamlessly.

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
    # Google Sheets Integration (optional)
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    
    # Microsoft Excel Integration (optional)
    AZURE_AD_CLIENT_ID=YOUR_AZURE_AD_CLIENT_ID
    AZURE_AD_CLIENT_SECRET=YOUR_AZURE_AD_CLIENT_SECRET
    AZURE_AD_TENANT_ID=YOUR_AZURE_AD_TENANT_ID
    
    # Required
    NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
    NEXTAUTH_URL=http://localhost:3000
    ```

    -   `NEXTAUTH_SECRET`: You can generate a strong secret using `openssl rand -base64 32`.
    -   You can configure either Google Sheets, Microsoft Excel, or both providers.

4.  **Provider Setup (Choose One or Both):**

    ### Google Sheets Setup

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

    ### Microsoft Excel Setup

    To get `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID`, you need to create an Azure App Registration:

    a.  Go to [Azure Portal](https://portal.azure.com) and sign in.
    b.  Navigate to "Azure Active Directory" > "App registrations".
    c.  Click "New registration" and configure:
        -   **Name**: Tu Tasks Excel Integration
        -   **Account types**: Accounts in any organizational directory and personal Microsoft accounts
        -   **Redirect URI**: Web - `http://localhost:3000/api/auth/callback/azure-ad`
    d.  After creation, go to "Authentication" and add production redirect URI:
        -   `https://your-app.com/api/auth/callback/azure-ad`
    e.  Go to "API permissions" > "Add a permission" > "Microsoft Graph" > "Delegated permissions":
        -   Add: `Files.ReadWrite`, `offline_access`, `openid`, `profile`, `email`
    f.  Go to "Certificates & secrets" > "New client secret":
        -   Copy the secret value immediately
    g.  From "Overview" page, copy the Application (client) ID and Directory (tenant) ID.

    **📋 For detailed Microsoft Excel setup instructions, see [MICROSOFT_EXCEL_SETUP.md](./MICROSOFT_EXCEL_SETUP.md)**

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

-   **Dual Provider Support**: Choose between Google Sheets and Microsoft Excel Online
-   **Task Management**: Create, read, update, and delete tasks
-   **Monthly Organization**: Automatically organizes tasks by month (YYYY-MM format)
-   **Batch Operations**: Import multiple tasks at once
-   **Authentication**: Secure OAuth2 login for both Google and Microsoft accounts
-   **Visual Indicators**: Provider icons to distinguish between Google and Excel workbooks
-   **Date/Time Handling**: Automatic conversion between different date formats

## Project Structure

-   `src/app`: Contains the main application pages and layout.
-   `src/components`: Reusable React components.
-   `src/lib/providers`: Spreadsheet provider implementations (Google Sheets & Excel).
-   `src/pages/api`: API routes for backend functionality, including NextAuth authentication and spreadsheet interactions.
-   `src/utils`: Utility functions for date handling and calendar operations.

## Provider Details

### Google Sheets Provider
- Uses Google Sheets API v4
- Stores tasks in Google Sheets with monthly organization
- Requires Google Cloud Console setup

### Microsoft Excel Provider  
- Uses Microsoft Graph API
- Stores tasks in Excel Online (.xlsx files) in OneDrive
- Requires Azure App Registration setup
- Automatically handles Excel's date serial number format

## Additional Documentation

- **[Microsoft Excel Setup Guide](./MICROSOFT_EXCEL_SETUP.md)**: Comprehensive setup instructions for Excel integration
- **Troubleshooting**: Check the setup guide for common authentication and API issues
