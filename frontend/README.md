NBK YOUTH (WEB APP)
Designed and Developed by KOLLI VINEETH
Started on OCT 2024

DIRECTORY STRUCTURE
|   
|   README.md
|   
+---backend
|   |   .env
|   |   .gitignore
|   |   package-lock.json
|   |   package.json
|   |   server.js
|   |   
|   +---config
|   |       cloudinary.js
|   |       roles.js
|   |       
|   +---controllers
|   |       activityLogController.js
|   |       authController.js
|   |       bannerController.js
|   |       collectionController.js
|   |       committeeController.js
|   |       developerController.js
|   |       estimationController.js
|   |       expenseController.js
|   |       gameController.js
|   |       hiddenProfileController.js
|   |       homepageController.js
|   |       incomeController.js
|   |       maintenanceController.js
|   |       momentController.js
|   |       notificationController.js
|   |       paymentController.js
|   |       paymentDetailsController.js
|   |       statsController.js
|   |       usersController.js
|   |       verificationController.js
|   |       
|   +---middleware
|   |       activityLogger.js
|   |       auth.js
|   |       
|   +---models
|   |       ActivityLog.js
|   |       Banner.js
|   |       Collection.js
|   |       Committee.js
|   |       EstimatedExpense.js
|   |       EstimatedIncome.js
|   |       Event.js
|   |       Expense.js
|   |       Game.js
|   |       HiddenProfile.js
|   |       Income.js
|   |       MaintenanceMode.js
|   |       Moment.js
|   |       Notification.js
|   |       NotificationHistory.js
|   |       OTP.js
|   |       Payment.js
|   |       PaymentDetails.js
|   |       PreviousYear.js
|   |       Slide.js
|   |       User.js
|   |       
|   +---routes
|   |       activityLogs.js
|   |       auth.js
|   |       banners.js
|   |       collections.js
|   |       committee.js
|   |       developer.js
|   |       estimation.js
|   |       expenses.js
|   |       games.js
|   |       hiddenProfiles.js
|   |       homepage.js
|   |       incomes.js
|   |       maintenance.js
|   |       moments.js
|   |       notifications.js
|   |       payment.js
|   |       paymentDetails.js
|   |       stats.js
|   |       users.js
|   |       verification.js
|   |       
|   \---utils
|           emailService.js
|           setupDefaults.js
|           
\---frontend
    |   .env
    |   .gitignore
    |   eslint.config.js
    |   index.html
    |   package-lock.json
    |   package.json
    |   postcss.config.cjs
    |   README.md
    |   tailwind.config.js
    |   vercel.json
    |   vite.config.js
    |   
    +---dev-dist
    |       registerSW.js
    |       sw.js
    |       workbox-2e2c7e18.js
    |       
    +---dist
    |   |   index.html
    |   |   logo.png
    |   |   manifest.json
    |   |   manifest.webmanifest
    |   |   notificationlogo.png
    |   |   registerSW.js
    |   |   sw.js
    |   |   
    |   \---assets
    |           html2canvas.esm-CBrSDip1.js
    |           index-B6Tgvw9K.js
    |           index-D5Bdzh-a.css
    |           index.es-Htf3CKeG.js
    |           purify.es-a-CayzAK.js
    |           
    +---public
    |       developerImage.png
    |       logo-128x128.png
    |       logo-144x144.png
    |       logo-152x152.png
    |       logo-192x192.png
    |       logo-384x384.png
    |       logo-512x512.png
    |       logo-72x72.png
    |       logo-96x96.png
    |       logo.png
    |       manifest.json
    |       notificationlogo.png
    |       
    \---src
        |   App.jsx
        |   index.css
        |   main.jsx
        |   sw.js
        |   
        +---components
        |   |   Footer.jsx
        |   |   Header.jsx
        |   |   ProtectedRoute.jsx
        |   |   Sidebar.jsx
        |   |   
        |   +---activityLogs
        |   |       LogFilters.jsx
        |   |       LogPrint.jsx
        |   |       LogStats.jsx
        |   |       LogTable.jsx
        |   |       
        |   +---auth
        |   |       ForgotPassword.jsx
        |   |       InstallApp.jsx
        |   |       LanguageToggle.jsx
        |   |       OTPVerification.jsx
        |   |       ResetPassword.jsx
        |   |       
        |   +---developer
        |   |       BannerManager.jsx
        |   |       ClearData.jsx
        |   |       MaintenanceMode.jsx
        |   |       PaymentDetails.jsx
        |   |       PopupBanner.jsx
        |   |       Stats.jsx
        |   |       
        |   +---estimation
        |   |       ExpensePrint.jsx
        |   |       ExpenseSection.jsx
        |   |       ExpenseTable.jsx
        |   |       Form.jsx
        |   |       IncomePrint.jsx
        |   |       IncomeSection.jsx
        |   |       IncomeTable.jsx
        |   |       Stats.jsx
        |   |       StatsPrint.jsx
        |   |       
        |   +---expense
        |   |       ExpenseEnglishPrint.jsx
        |   |       ExpenseFilters.jsx
        |   |       ExpenseForm.jsx
        |   |       ExpenseTable.jsx
        |   |       ExpenseTeluguPrint.jsx
        |   |       
        |   +---games
        |   |       GameCard.jsx
        |   |       GameForm.jsx
        |   |       PlayerForm.jsx
        |   |       PlayerList.jsx
        |   |       TimeForm.jsx
        |   |       
        |   +---home
        |   |       InstallApp.jsx
        |   |       SlideOrder.jsx
        |   |       Slideshow.jsx
        |   |       Timeline.jsx
        |   |       
        |   +---income
        |   |       IncomeEnglishPrint.jsx
        |   |       IncomeFilters.jsx
        |   |       IncomeForm.jsx
        |   |       IncomeTable.jsx
        |   |       IncomeTeluguPrint.jsx
        |   |       
        |   +---moments
        |   |       MediaPreview.jsx
        |   |       MomentForm.jsx
        |   |       MomentGrid.jsx
        |   |       
        |   +---notifications
        |   |       NotificationForm.jsx
        |   |       NotificationHistory.jsx
        |   |       
        |   +---payment
        |   |       PaymentForm.jsx
        |   |       PaymentHistory.jsx
        |   |       
        |   +---profile
        |   |       ProfileImage.jsx
        |   |       ProfileImageDialog.jsx
        |   |       
        |   +---settings
        |   |       InstallApp.jsx
        |   |       NotificationSettings.jsx
        |   |       
        |   +---stats
        |   |       StatsEnglishPrint.jsx
        |   |       StatsTeluguPrint.jsx
        |   |       
        |   +---techstack
        |   |       Access.jsx
        |   |       MindMap.jsx
        |   |       Technologies.jsx
        |   |       
        |   +---verification
        |   |       VerificationFilters.jsx
        |   |       VerificationTable.jsx
        |   |       
        |   \---vibe
        |           CollectionItem.jsx
        |           CollectionManager.jsx
        |           MusicPlayer.jsx
        |           SearchBar.jsx
        |           SongItem.jsx
        |           SubCollectionItem.jsx
        |           
        +---context
        |       AuthContext.jsx
        |       HiddenProfileContext.jsx
        |       LanguageContext.jsx
        |       MaintenanceModeContext.jsx
        |       MusicContext.jsx
        |       
        +---layouts
        |       AuthLayout.jsx
        |       DashboardLayout.jsx
        |       
        +---pages
        |       ActivityLogs.jsx
        |       AdminPanel.jsx
        |       Committee.jsx
        |       DeveloperOptions.jsx
        |       Estimation.jsx
        |       Expense.jsx
        |       Home.jsx
        |       Income.jsx
        |       LetsPlay.jsx
        |       Maintenance.jsx
        |       Moments.jsx
        |       Notifications.jsx
        |       PayOnline.jsx
        |       Profile.jsx
        |       RecycleBin.jsx
        |       Settings.jsx
        |       SignIn.jsx
        |       SignUp.jsx
        |       Stats.jsx
        |       TechStack.jsx
        |       Users.jsx
        |       Verification.jsx
        |       Vibe.jsx
        |       
        \---utils
                analytics.js
                config.js
                gameUtils.js
                mediaHelpers.js
                paymentReceipt.js
                roles.js
                search.js
                songQueue.js
                vapidKeys.js
                
                
tree /F /A  > directory_structure.txt