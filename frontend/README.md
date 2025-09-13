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
|   |       historyController.js
|   |       homepageController.js
|   |       incomeController.js
|   |       lockSettingsController.js
|   |       maintenanceController.js
|   |       momentController.js
|   |       momentMediaController.js
|   |       notificationController.js
|   |       paymentController.js
|   |       paymentDetailsController.js
|   |       recordsController.js
|   |       snapshotController.js
|   |       statsController.js
|   |       usersController.js
|   |       verificationController.js
|   |       viniController.js
|   |       
|   +---middleware
|   |       activityLogger.js
|   |       auth.js
|   |       
|   +---models
|   |       ActivityLog.js
|   |       Banner.js
|   |       ChatHistory.js
|   |       Collection.js
|   |       Committee.js
|   |       Counter.js
|   |       EstimatedExpense.js
|   |       EstimatedIncome.js
|   |       Event.js
|   |       EventLabel.js
|   |       EventRecord.js
|   |       Expense.js
|   |       FinancialRecord.js
|   |       Game.js
|   |       HiddenProfile.js
|   |       History.js
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
|   |       ProcessedChunk.js
|   |       ProcessedRecords.js
|   |       Slide.js
|   |       Snapshot.js
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
|   |       histories.js
|   |       homepage.js
|   |       incomes.js
|   |       lockSettings.js
|   |       maintenance.js
|   |       moments.js
|   |       notifications.js
|   |       payment.js
|   |       paymentDetails.js
|   |       records.js
|   |       snapshots.js
|   |       stats.js
|   |       users.js
|   |       verification.js
|   |       vini.js
|   |       
|   +---services
|   |       embeddingService.js
|   |       processedRecordsService.js
|   |       viniService.js
|   |       
|   \---utils
|           driveUtils.js
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
        |   |       LogStatsPrint.jsx
        |   |       LogTable.jsx
        |   |       
        |   +---adminPanel
        |   |       BannerManager.jsx
        |   |       EventLabelManager.jsx
        |   |       LockManager.jsx
        |   |       MaintenanceMode.jsx
        |   |       PaymentDetails.jsx
        |   |       PopupBanner.jsx
        |   |       Stats.jsx
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
        |   |       ClearData.jsx
        |   |       ProcessedDataManager.jsx
        |   |       SnapshotManager.jsx
        |   |       
        |   +---estimation
        |   |       ExpensePrint.jsx
        |   |       ExpenseSection.jsx
        |   |       ExpenseTable.jsx
        |   |       ExpenseTeluguPrint.jsx
        |   |       Form.jsx
        |   |       IncomePrint.jsx
        |   |       IncomeSection.jsx
        |   |       IncomeTable.jsx
        |   |       IncomeTeluguPrint.jsx
        |   |       Stats.jsx
        |   |       StatsPrint.jsx
        |   |       StatsTeluguPrint.jsx
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
        |   +---histories
        |   |       HistoryEnglishPrint.jsx
        |   |       HistoryEvents.jsx
        |   |       HistoryExpense.jsx
        |   |       HistoryForm.jsx
        |   |       HistoryIncome.jsx
        |   |       HistoryStats.jsx
        |   |       HistoryTeluguPrint.jsx
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
        |   |       MediaDriveForm.jsx
        |   |       MediaGallery.jsx
        |   |       MediaGalleryReorder.jsx
        |   |       MediaLightbox.jsx
        |   |       MediaPreview.jsx
        |   |       MediaUploadForm.jsx
        |   |       MomentForm.jsx
        |   |       MomentGrid.jsx
        |   |       MomentReorder.jsx
        |   |       WatchMore.jsx
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
        |   +---records
        |   |       EventRecordForm.jsx
        |   |       EventRecordsGrid.jsx
        |   |       FinancialRecordForm.jsx
        |   |       FinancialTimeline.jsx
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
        |   +---vibe
        |   |       CollectionItem.jsx
        |   |       CollectionManager.jsx
        |   |       FloatingMusicIcon.jsx
        |   |       MusicPlayer.jsx
        |   |       SearchBar.jsx
        |   |       SongItem.jsx
        |   |       
        |   \---vini
        |           ChatWidget.jsx
        |           FloatingButton.jsx
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
        |       Histories.jsx
        |       Home.jsx
        |       Income.jsx
        |       LetsPlay.jsx
        |       Maintenance.jsx
        |       Moments.jsx
        |       Notifications.jsx
        |       PayOnline.jsx
        |       Profile.jsx
        |       Records.jsx
        |       RecycleBin.jsx
        |       Settings.jsx
        |       SignIn.jsx
        |       SignUp.jsx
        |       Stats.jsx
        |       TechStack.jsx
        |       Users.jsx
        |       Verification.jsx
        |       Vibe.jsx
        |       vini.jsx
        |       
        \---utils
                analytics.js
                config.js
                dateTime.js
                gameUtils.js
                notifications.js
                paymentReceipt.js
                roles.js
                search.js
                songQueue.js
                vapidKeys.js
                
                
tree /F /A  > directory_structure.txt