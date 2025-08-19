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
|   |       eventLabelController.js
|   |       expenseController.js
|   |       gameController.js
|   |       hiddenProfileController.js
|   |       homepageController.js
|   |       incomeController.js
|   |       lockSettingsController.js
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
|   |       EventLabel.js
|   |       Expense.js
|   |       Game.js
|   |       HiddenProfile.js
|   |       Income.js
|   |       LockSettings.js
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
|   |       eventLabel.js
|   |       expenses.js
|   |       games.js
|   |       hiddenProfiles.js
|   |       homepage.js
|   |       incomes.js
|   |       lockSettings.js
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
    +---public
    |   |   developerImage.png
    |   |   google1f3713de9cdfe399.html
    |   |   manifest.json
    |   |   
    |   \---logo
    |           1200x630.png
    |           128.png
    |           144.png
    |           152.png
    |           16.png
    |           167.png
    |           180.png
    |           192.png
    |           32.png
    |           512.png
    |           96.png
    |           notificationlogo.png
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
        |   +---common
        |   |       EventLabelDisplay.jsx
        |   |       LockIndicator.jsx
        |   |       
        |   +---developer
        |   |       BannerManager.jsx
        |   |       ClearData.jsx
        |   |       EventLabelManager.jsx
        |   |       LockManager.jsx
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
        |   |       NotificationPrompt.jsx
        |   |       Slideshow.jsx
        |   |       SlidesOrder.jsx
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
        |   |       NotificationAutoRegister.jsx
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
        |           FloatingMusicIcon.jsx
        |           MusicPlayer.jsx
        |           SearchBar.jsx
        |           SongItem.jsx
        |           
        +---context
        |       AuthContext.jsx
        |       EventLabelContext.jsx
        |       HiddenProfileContext.jsx
        |       LanguageContext.jsx
        |       LockContext.jsx
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
                dateTime.js
                gameUtils.js
                mediaHelpers.js
                notifications.js
                paymentReceipt.js
                roles.js
                search.js
                songQueue.js
                vapidKeys.js
                
                
tree /F /A  > directory_structure.txt