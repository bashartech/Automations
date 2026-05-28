📋 LINKEDIN OFFICIAL API - COMPLETE SETUP GUIDE    

    PHASE 1: Create LinkedIn Developer App (30 minutes)

    Step 1: Go to LinkedIn Developer Portal

     1. Open: https://www.linkedin.com/developers/apps 
        (https://www.linkedin.com/developers/apps)     
     2. Click: "Create app" button

    Step 2: Fill App Details


    ┌─────────────────┬────────────────────────────────────────────────────┐   
    │ Field           │ What to Enter                                      │   
    ├─────────────────┼────────────────────────────────────────────────────┤   
    │ App Name        │ AI Employee Vault                                  │   
    │ LinkedIn Page   │ Select your company page (or create personal br... │   
    │ App Logo        │ Upload any 300x300px image                         │   
    │ **Privacy Poli... │ https://yourdomain.com/privacy (can be placehol...   
    │
    │ **User Agreeme... │ https://yourdomain.com/terms (can be placeholder)    
    │
    │ App Description │ `AI-powered employee automation system for post... │   
    └─────────────────┴────────────────────────────────────────────────────┘   


    Step 3: Verify Company

     - LinkedIn will ask you to verify you're associated with the company
     - Click "Verify" and confirm your LinkedIn account

    Step 4: App Created!

     - You'll see your App Dashboard
     - Note your Client ID and Client Secret (keep these safe!)

    ---

    PHASE 2: Request API Permissions (1-2 days approval) 

    Step 1: Go to Auth Tab

     1. Click "Auth" tab in your app dashboard
     2. Add Redirect URL: https://localhost:8080/callback
     3. Click: "Add"

    Step 2: Request Permissions

     1. Click "Permissions" tab
     2. Click "Request permission"
     3. Request these permissions:


    ┌────────────────┬──────────────────────────┬───────────────┐
    │ Permission     │ Purpose                  │ Approval Time │
    ├────────────────┼──────────────────────────┼───────────────┤
    │ w_member_social  │ Post updates to LinkedIn │ 1-2 days      │
    │ r_basicprofile │ Read basic profile info  │ 1-2 days      │
    │ r_emailaddress │ Get email address        │ 1-2 days      │
    └────────────────┴──────────────────────────┴───────────────┘


     4. Fill in description for each:

     1    This app will post automated updates to LinkedIn on behalf of 
       users.
     2    Users authorize the app to create posts about AI automation,  
       business updates, and industry insights.

     5. Submit for review

    Step 3: Wait for Approval

     - LinkedIn reviews within 1-2 business days
     - You'll get email when approved
     - Status changes from "Pending" to "Approved" in dashboard

    ---

    PHASE 3: Generate Access Token (After Approval)

    Step 1: OAuth 2.0 Authorization

    Once approved, generate your access token:

    On Windows (PowerShell):

      1 # Create token generator script
      2 @'
      3 # LinkedIn OAuth Token Generator
      4 # Replace these with YOUR app credentials
      5 
      6 $ClientId = "YOUR_CLIENT_ID_HERE"
      7 $ClientSecret = "YOUR_CLIENT_SECRET_HERE"
      8 $RedirectUri = "https://localhost:8080/callback"
      9 
     10 # Step 1: Get authorization URL
     11 $AuthUrl = 
        "https://www.linkedin.com/oauth/v2/authorization?response_type=code&c
        lient_id=$ClientId&redirect_uri=$RedirectUri&scope=w_member_social   
        %20r_basicprofile"
     12 
     13 Write-Host "=================================="
     14 Write-Host "LINKEDIN OAUTH TOKEN GENERATOR"
     15 Write-Host "=================================="
     16 Write-Host ""
     17 Write-Host "Step 1: Open this URL in your browser:"
     18 Write-Host $AuthUrl
     19 Write-Host ""
     20 Write-Host "Step 2: Login and authorize the app"
     21 Write-Host "Step 3: Copy the 'code' parameter from redirect URL"     
     22 Write-Host ""
     23 
     24 $Code = Read-Host "Enter the authorization code"
     25 
     26 # Step 2: Exchange code for token
     27 $TokenUrl = "https://www.linkedin.com/oauth/v2/accessToken"
     28 $Body = @{
     29     grant_type = "authorization_code"
     30     code = $Code
     31     redirect_uri = $RedirectUri
     32     client_id = $ClientId
     33     client_secret = $ClientSecret
     34 }
     35 
     36 $Response = Invoke-RestMethod -Uri $TokenUrl -Method Post -Body $Body  
        -ContentType "application/x-www-form-urlencoded"
     37 
     38 Write-Host ""
     39 Write-Host "=================================="
     40 Write-Host "ACCESS TOKEN"
     41 Write-Host "=================================="
     42 Write-Host $Response.access_token
     43 Write-Host ""
     44 Write-Host "Token expires in: $($Response.expires_in) seconds"
     45 Write-Host ""
     46 Write-Host "Save this token! You'll need it for posting."
     47 '@ | Out-File -FilePath generate_linkedin_token.ps1 -Encoding utf8     
     48 
     49 echo "✓ Token generator created"
     50 echo "After LinkedIn approves your app:"
     51 echo "1. Edit generate_linkedin_token.ps1"
     52 echo "2. Replace YOUR_CLIENT_ID_HERE and YOUR_CLIENT_SECRET_HERE"      
     53 echo "3. Run: .\generate_linkedin_token.ps1"

    ---

    PHASE 4: Implement API (After Approval)

    Once you get approval email, upload this file:


  ╭─────────────────────────────────────────────────────────────────────────╮
  │ ✓  WriteFile Writing to engine\linkedin_poster_official.py              │
  │                                                                         │
  │    ... first 48 lines hidden ...                                        │
  │     49         except Exception as e:                                   │
  │     50             logger.error(f"❌ Error extracting content: {e}")    │ 
  │     51             return "", None                                      │
  │     52                                                                  │
  │     53     def create_post(self, text):                                 │
  │     54         """Create LinkedIn post via Official API"""              │
  │     55         try:                                                     │
  │     56             logger.info(f"📝 Creating LinkedIn post via Official │
  │        API...")                                                         │
  │     57             logger.info(f"   Content length: {len(text)}         │
  │        characters")                                                     │
  │     58                                                                  │
  │     59             # LinkedIn API endpoint for creating posts           │
  │     60             url = "https://api.linkedin.com/v2/shares"           │
  │     61                                                                  │
  │     62             headers = {                                          │
  │     63                 "Authorization": f"Bearer {self.access_token}",  │
  │     64                 "Content-Type": "application/json",              │  
  │     65                 "X-Restli-Protocol-Version": "2.0.0"             │  
  │     66             }                                                    │  
  │     67                                                                  │  
  │     68             # Prepare post data                                  │  
  │     69             data = {                                             │  
  │     70                 "owner": f"urn:li:person:{self.person_urn}",     │  
  │     71                 "text": {                                        │  
  │     72                     "text": text[:3000]  # LinkedIn limit: 3000  │  
  │        characters                                                       │  
  │     73                 },                                               │  
  │     74                 "distribution": {                                │  
  │     75                     "feedDistribution": "MAIN_FEED",             │  
  │     76                     "targetEntities": [],                        │  
  │     77                     "thirdPartyDistributionChannels": []         │  
  │     78                 }                                                │  
  │     79             }                                                    │  
  │     80                                                                  │  
  │     81             # Send request                                       │  
  │     82             response = requests.post(url, headers=headers,       │  
  │        json=data)                                                       │  
  │     83                                                                  │  
  │     84             if response.status_code == 201:                      │
  │     85                 result = response.json()                         │  
  │     86                 post_id = result.get('id', 'Unknown')            │  
  │     87                 logger.info(f"✅ LinkedIn post published!")      │   
  │     88                 logger.info(f"   Post ID: {post_id}")            │  
  │     89                 return True                                      │  
  │     90             else:                                                │  
  │     91                 logger.error(f"❌ Post failed:                   │   
  │        {response.status_code}")                                         │  
  │     92                 logger.error(f"   Response: {response.text}")    │  
  │     93                 return False                                     │  
  │     94                                                                  │  
  │     95         except Exception as e:                                   │  
  │     96             logger.error(f"❌ Error creating post: {e}")         │   
  │     97             return False                                         │  
  │     98                                                                  │  
  │     99     def refresh_token(self):                                     │  
  │    100         """Refresh access token (if using refresh token flow)""" │  
  │    101         # Implement if needed for long-term use                  │  
  │    102         pass                                                     │  
  │    103                                                                  │  
  │    104     def process_approved_post(self, filepath):                   │  
  │    105         """Process approved post"""                              │  
  │    106         try:                                                     │  
  │    107             logger.info(f"📋 Processing: {filepath.name}")       │  
  │    108                                                                  │  
  │    109             # Extract content                                    │  
  │    110             content, _ = self.extract_post_content(filepath)     │  
  │    111             if not content:                                      │  
  │    112                 logger.error("❌ No content")                    │   
  │    113                 return False                                     │  
  │    114                                                                  │  
  │    115             # Create post                                        │  
  │    116             success = self.create_post(content)                  │  
  │    117                                                                  │  
  │    118             if success:                                          │  
  │    119                 logger.info("✅ Post published successfully")    │   
  │    120                 return True                                      │  
  │    121             return False                                         │  
  │    122                                                                  │  
  │    123         except Exception as e:                                   │
  │    124             logger.error(f"❌ Error: {e}")                       │   
  │    125             return False                                         │  
  │    126                                                                  │  
  │    127                                                                  │  
  │    128 if __name__ == "__main__":                                       │  
  │    129     print("="*60)                                                │  
  │    130     print("LINKEDIN OFFICIAL API - TEST")                        │  
  │    131     print("="*60)                                                │  
  │    132     print()                                                      │  
  │    133     print("Before using this, you must:")                        │  
  │    134     print("1. Create LinkedIn Developer App")                    │  
  │    135     print("2. Get API permissions approved")                     │  
  │    136     print("3. Generate access token")                            │  
  │    137     print("4. Update credentials in linkedin_poster.py")         │  
  │    138     print()                                                      │  
  │    139     print("Get started:                                          │  
  │        https://www.linkedin.com/developers/apps")                       │  
  │    140     print()                                                      │  
  ╰─────────────────────────────────────────────────────────────────────────╯  

  ✦ Now I need to provide a complete guide with all the steps, temporary       
    solutions while waiting for approval, and a clear timeline for the user to 
    follow.

  ✦ Perfect! Now here's your complete action plan:

    ---

    📅 COMPLETE ACTION PLAN

    TODAY (30 minutes)

      1 # 1. Create LinkedIn Developer App
      2 # Go to: https://www.linkedin.com/developers/apps
      3 # Click "Create app"
      4 # Fill in all details
      5 
      6 # 2. Request Permissions
      7 # Go to Auth tab → Add redirect URL
      8 # Go to Permissions tab → Request:
      9 #   - w_member_social
     10 #   - r_basicprofile
     11 
     12 # 3. Submit for review

    WHILE WAITING FOR APPROVAL (1-2 days)

    Use this temporary solution:

      1 # SSH into server
      2 ssh -i "C:\Users\H P\.ssh\digitaloceonsshkey" root@167.71.237.77
      3 
      4 # Create simple manual poster
      5 cat > /home/AI_Employee/quick_linkedin_post.py << 'EOF'
      6 """Quick LinkedIn Post - Manual but Reliable"""
      7 import webbrowser
      8 import sys
      9 
     10 print("\n" + "="*60)
     11 print("QUICK LINKEDIN POST")
     12 print("="*60)
     13 print("\nThis will open LinkedIn in your browser")
     14 print("You can create and post manually")
     15 print("\nOpening LinkedIn...")
     16 
     17 webbrowser.open("https://linkedin.com/feed")
     18 
     19 print("\n✅ Browser opened!")
     20 print("👉 Create your post")
     21 print("👉 Click Post")
     22 print("\nDone! 🚀\n")
     23 EOF
     24 
     25 echo "✓ Quick poster created"
     26 echo "To post: python /home/AI_Employee/quick_linkedin_post.py"        

    AFTER APPROVAL (1-2 days later)

      1 # 1. You'll get email: "Your LinkedIn API app is approved"
      2 
      3 # 2. Generate access token
      4 # On Windows PowerShell:
      5 cd D:\DATA\HACKATHON_0\AI_Employee_Vault
      6 .\generate_linkedin_token.ps1
      7 
      8 # 3. Upload official API poster
      9 scp -i "C:\Users\H P\.ssh\digitaloceonsshkey" 
        D:\DATA\HACKATHON_0\AI_Employee_Vault\engine\linkedin_poster_official
        .py root@167.71.237.77:/home/AI_Employee/engine/linkedin_poster.py   
     10 
     11 # 4. Edit credentials on server
     12 ssh -i "C:\Users\H P\.ssh\digitaloceonsshkey" root@167.71.237.77     
     13 nano /home/AI_Employee/engine/linkedin_poster.py
     14 
     15 # Update these lines:
     16 # self.client_id = "YOUR_ACTUAL_CLIENT_ID"
     17 # self.client_secret = "YOUR_ACTUAL_CLIENT_SECRET"
     18 # self.access_token = "YOUR_GENERATED_TOKEN"
     19 # self.person_urn = "YOUR_PERSON_URN"
     20 
     21 # 5. Test
     22 python /home/AI_Employee/engine/linkedin_poster.py
     23 
     24 # 6. Restart execute_approved
     25 pm2 restart execute-approved

    ---

    📊 TIMELINE


    ┌─────────┬───────────────────────────────┬───────────────────┐
    │ Day     │ Task                          │ Status            │
    ├─────────┼───────────────────────────────┼───────────────────┤
    │ Today   │ Create LinkedIn App           │ ⏳ Do now         │
    │ Today   │ Submit for API approval       │ ⏳ Do now         │
    │ Day 1-2 │ Wait for approval             │ ⏳ Pending        │
    │ Day 2-3 │ Generate token, implement API │ ⏳ After approval │
    │ Day 3+  │ 100% reliable posting!        │ ✅ Done           │
    └─────────┴───────────────────────────────┴───────────────────┘

    ---

    🔗 IMPORTANT LINKS


    ┌───────────┬───────────────────────────────────────────────────────────┐
    │ Resource  │ URL                                                       │
    ├───────────┼───────────────────────────────────────────────────────────┤
    │ **Develo... │ https://www.linkedin.com/developers/apps
     │
    │ **API Do... │ https://learn.microsoft.com/en-us/linkedin/
     │
    │ **Permis... │ https://learn.microsoft.com/en-us/linkedin/shared/auth...  
     │
    │ Post API  │ https://learn.microsoft.com/en-us/linkedin/marketing/i... │  
    └───────────┴───────────────────────────────────────────────────────────┘  


    ---

    ✅ WHAT TO DO RIGHT NOW

     1. Open: https://www.linkedin.com/developers/apps
     2. Click: "Create app"
     3. Fill in the details I listed above
     4. Submit for API permissions
     5. Wait 1-2 days for approval email

    In the meantime, use the manual posting script I created.

    ---

    Once you get the approval email, come back and I'll help you implement 
    the official API! 🚀

    Questions? Ask me anything about the LinkedIn API setup!
