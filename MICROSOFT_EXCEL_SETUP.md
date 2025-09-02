# Microsoft Excel Provider Setup Guide

## Overview

The Microsoft Excel provider enables Tu Tasks to integrate with Excel Online (Microsoft 365) workbooks stored in OneDrive. This provider uses the Microsoft Graph API to read and write task data to Excel spreadsheets, providing an alternative to Google Sheets integration.

## Features

- **Workbook Management**: List, create, and access Excel workbooks (.xlsx files) in OneDrive
- **Task Operations**: Add, update, delete, and batch import tasks
- **Worksheet Organization**: Automatically creates monthly worksheets (e.g., "2024-08", "2024-09")
- **Data Integrity**: Includes version identifiers and proper error handling
- **Date/Time Conversion**: Handles Excel's serial number format for dates and times
- **Provider Detection**: Distinguishes between Google Sheets and Excel file IDs

## Prerequisites

- Microsoft 365 account (personal or work/school)
- Azure Active Directory app registration
- Next.js application with NextAuth.js configured

## Step-by-Step Setup

### 1. Create Azure App Registration

1. **Navigate to Azure Portal**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Register New Application**:
   - Go to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Fill in the details:
     ```
     Name: Tu Tasks Excel Integration
     Supported account types: Accounts in any organizational directory and personal Microsoft accounts
     Redirect URI: Web - http://localhost:3000/api/auth/callback/azure-ad
     ```

3. **Configure Authentication**:
   - After creation, go to "Authentication" section
   - Add additional redirect URIs for production:
     ```
     https://your-domain.com/api/auth/callback/azure-ad
     ```
   - Under "Implicit grant and hybrid flows", enable:
     - ✅ ID tokens
     - ✅ Access tokens

4. **Set API Permissions**:
   - Go to "API permissions" section
   - Click "Add a permission" > "Microsoft Graph" > "Delegated permissions"
   - Add the following permissions:
     ```
     Files.ReadWrite        - Read and write user files
     offline_access         - Maintain access to data
     openid                - Sign in and read user profile
     profile               - View users' basic profile
     email                 - View users' email address
     ```
   - Click "Grant admin consent" (if available)

5. **Create Client Secret**:
   - Go to "Certificates & secrets" section
   - Click "New client secret"
   - Add description: "Tu Tasks Excel Integration"
   - Set expiration: 24 months (recommended)
   - **Copy the secret value immediately** (you won't see it again)

6. **Copy Application Details**:
   - Go to "Overview" section
   - Copy the "Application (client) ID"
   - Copy the "Directory (tenant) ID"

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```env
# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your_application_client_id_here
AZURE_AD_CLIENT_SECRET=your_client_secret_here
AZURE_AD_TENANT_ID=your_tenant_id_here

# NextAuth Configuration (if not already set)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Update NextAuth Configuration

Ensure your `pages/api/auth/[...nextauth].ts` includes the Azure AD provider:

```typescript
import AzureADProvider from "next-auth/providers/azure-ad"

export default NextAuth({
  providers: [
    // ... other providers
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email offline_access Files.ReadWrite"
        }
      }
    })
  ],
  // ... rest of configuration
})
```

### 4. Test the Integration

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Authentication**:
   - Go to http://localhost:3000
   - Click "Sign in with Microsoft Excel"
   - Complete OAuth flow
   - Verify you can see your Excel files

3. **Create Test Workbook**:
   - The app will create a workbook with the identifier in cell A1
   - Monthly worksheets will be created automatically as needed

## Data Structure

### Workbook Organization
- **Identifier Cell (A1)**: Contains `created:tutasks.com version:1.0.0`
- **Monthly Worksheets**: Named as `YYYY-MM` (e.g., "2024-08", "2024-09")
- **Header Row**: UID | Task Number | Description | Date | Time

### Data Formats
- **Dates**: Excel serial numbers (e.g., 45895 = 2025-08-26)
- **Times**: Decimal hours (e.g., 4.5 = 4.5 hours)
- **UIDs**: Generated unique identifiers for each task

## Troubleshooting

### Common Issues

1. **"unauthorized_client" Error**:
   - **Cause**: Azure app not configured for personal accounts
   - **Solution**: In Azure portal, ensure "Supported account types" includes personal Microsoft accounts

2. **"invalid_grant" on Token Refresh**:
   - **Cause**: Missing offline_access scope
   - **Solution**: Add `offline_access` to the authorization scope in NextAuth config

3. **"MethodNotAllowed" API Errors**:
   - **Cause**: Using POST instead of PATCH for Excel operations
   - **Solution**: Excel provider uses PATCH for range updates (automatically handled)

4. **"ObjectHandle is Invalid"**:
   - **Cause**: Using Google Sheets ID for Excel operations
   - **Solution**: Provider automatically detects and validates file IDs

5. **Date Format Issues**:
   - **Cause**: Excel returns dates as serial numbers
   - **Solution**: Provider automatically converts Excel dates to YYYY-MM-DD format

### Debug Tips

1. **Enable Detailed Logging**:
   ```typescript
   // Add to your Excel operations
   console.log("Excel operation:", { sheetId, worksheetName, data });
   ```

2. **Check Token Status**:
   - Verify access token in browser dev tools
   - Check token expiration and refresh behavior

3. **Validate Permissions**:
   - Ensure all required Microsoft Graph permissions are granted
   - Check if admin consent is required for your organization

4. **Test File Access**:
   - Manually verify you can access Excel files in OneDrive
   - Check file permissions and sharing settings

## API Endpoints

The Excel provider integrates with existing API endpoints:

- `GET /api/sheets` - List available Excel workbooks
- `POST /api/sheets` - Create new Excel workbook
- `GET /api/tasks` - Get all tasks from Excel workbook
- `POST /api/tasks` - Add task to Excel workbook
- `PUT /api/tasks` - Update task in Excel workbook
- `DELETE /api/tasks` - Delete task from Excel workbook

## Security Considerations

1. **Token Storage**: Access tokens are handled securely by NextAuth.js
2. **Permissions**: Request only necessary Microsoft Graph permissions
3. **Data Validation**: All Excel data is validated before processing
4. **Error Handling**: Sensitive information is not exposed in error messages

## Support

For issues specific to:
- **Azure Configuration**: Check Microsoft Azure documentation
- **Graph API**: Refer to Microsoft Graph API documentation  
- **NextAuth**: Check NextAuth.js documentation
- **Tu Tasks Integration**: Review application logs and error messages

## Version History

- **v1.0.0**: Initial Excel provider implementation with full CRUD operations
- Supports Excel Online (Microsoft 365) integration
- Automatic date/time format conversion
- Provider icon display for visual differentiation