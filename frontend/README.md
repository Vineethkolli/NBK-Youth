NBK YOUTH GANGAVARAM (WEB APP)
Designed and Developed by KOLLI VINEETH
Started on OCT 2024


DIRECTORY STRUCTURE
|   
|   
|   .git
|   .gitignore
|   LICENSE
|   README.md
|   
+---.github
|   \---workflows
|           gmailtoken-keep-alive.yml
|           mongodb-backup.yml
|           renderbackend-keep-alive.yml
|           
+---backend
|   |   .dockerignore
|   |   .env
|   |   .gitignore
|   |   Dockerfile
|   |   package-lock.json
|   |   package.json
|   |   Readme.md
|   |   server.js
|   |   
|   +---config
|   |       access.js
|   |       cloudinary.js
|   |       
|   +---controllers
|   |       activityLogController.js
|   |       authController.js
|   |       bannerController.js
|   |       cloudinaryController.js
|   |       cloudinaryStorageController.js
|   |       committeeController.js
|   |       developerController.js
|   |       estimationController.js
|   |       eventLabelController.js
|   |       expenseController.js
|   |       gameController.js
|   |       githubActionsController.js
|   |       hiddenProfileController.js
|   |       historyController.js
|   |       homepageController.js
|   |       incomeController.js
|   |       lockSettingsController.js
|   |       maintenanceController.js
|   |       momentController.js
|   |       momentGalleryController.js
|   |       mongodbStorageController.js
|   |       notificationController.js
|   |       paymentController.js
|   |       paymentDetailsController.js
|   |       profileController.js
|   |       recordsController.js
|   |       scheduledNotificationController.js
|   |       serviceDriveStorageController.js
|   |       sessionController.js
|   |       snapshotController.js
|   |       statsController.js
|   |       usersController.js
|   |       verificationController.js
|   |       vibeController.js
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
|   |       ScheduledNotification.js
|   |       Session.js
|   |       Slide.js
|   |       Snapshot.js
|   |       User.js
|   |       Vibe.js
|   |       
|   +---routes
|   |       activityLogs.js
|   |       auth.js
|   |       banners.js
|   |       cloudinary.js
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
|   |       monitor.js
|   |       notifications.js
|   |       payment.js
|   |       paymentDetails.js
|   |       profile.js
|   |       records.js
|   |       scheduledNotifications.js
|   |       sessions.js
|   |       snapshots.js
|   |       stats.js
|   |       users.js
|   |       verification.js
|   |       vibe.js
|   |       vini.js
|   |       
|   +---scripts
|   |       checkServiceDriveStorage.js
|   |       getRefreshToken.js
|   |       migrate.js
|   |       
|   +---services
|   |       emailOTPService.js
|   |       embeddingService.js
|   |       processedRecordsService.js
|   |       SignupEmail.js
|   |       viniService.js
|   |       
|   \---utils
|           driveUtils.js
|           firebaseAdmin.js
|           ipLocation.js
|           keepRefreshTokenAlive.js
|           phoneValidation.js
|           redis.js
|           setupDefaults.js
|           statsAggregator.js
|           tokenUtils.js
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
    |   |   homepage.html
    |   |   manifest.json
    |   |   privacy_policy.html
    |   |   robots.txt
    |   |   sitemap.xml
    |   |   terms_of_service.html
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
    |           384.png
    |           512.png
    |           96.png
    |           favicon.ico
    |           notificationlogo.png
    |           
    \---src
        |   App.jsx
        |   index.css
        |   main.jsx
        |   sw.js
        |   
        +---components
        |   |   Explore.jsx
        |   |   Footer.jsx
        |   |   Header.jsx
        |   |   ProtectedRoute.jsx
        |   |   Sidebar.jsx
        |   |   
        |   +---activities
        |   |       EnglishPrint.jsx
        |   |       GameCard.jsx
        |   |       GameForm.jsx
        |   |       PlayerForm.jsx
        |   |       PlayerList.jsx
        |   |       TeluguPrint.jsx
        |   |       TimeForm.jsx
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
        |   |       MaintenanceMode.jsx
        |   |       PaymentDetails.jsx
        |   |       PopupBanner.jsx
        |   |       ScheduledNotifications.jsx
        |   |       
        |   +---auth
        |   |       ForgotPassword.jsx
        |   |       GoogleAuthButton.jsx
        |   |       GooglePhoneStep.jsx
        |   |       InstallApp.jsx
        |   |       LanguageToggle.jsx
        |   |       OTPVerification.jsx
        |   |       PhoneInput.jsx
        |   |       ResetPassword.jsx
        |   |       SetPassword.jsx
        |   |       SmartAuthInput.jsx
        |   |       
        |   +---authSessions
        |   |       Filters.jsx
        |   |       SessionsTable.jsx
        |   |       Stats.jsx
        |   |       
        |   +---common
        |   |       ErrorBoundary.jsx
        |   |       EventLabelDisplay.jsx
        |   |       InstallApp.jsx
        |   |       LockIndicator.jsx
        |   |       NotificationPrompt.jsx
        |   |       OfflineIndicator.jsx
        |   |       UpdateNameForm.jsx
        |   |       VersionUpdate.jsx
        |   |       
        |   +---developer
        |   |       ClearData.jsx
        |   |       LockManager.jsx
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
        |   |       Slideshow.jsx
        |   |       SlidesOrder.jsx
        |   |       SlidesUpload.jsx
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
        |   |       CopyToServiceDriveForm.jsx
        |   |       DriveMediaPreview.jsx
        |   |       DriveUploadForm.jsx
        |   |       MediaUploadForm.jsx
        |   |       MomentForm.jsx
        |   |       MomentGrid.jsx
        |   |       MomentReorder.jsx
        |   |       WatchMore.jsx
        |   |       YoutubeUploadForm.jsx
        |   |       
        |   +---momentsGallery
        |   |       CopyToServiceDriveForm.jsx
        |   |       GalleryGrid.jsx
        |   |       GalleryReorder.jsx
        |   |       Lightbox.jsx
        |   |       MediaUploadForm.jsx
        |   |       
        |   +---monitor
        |   |       CloudinaryMonitor.jsx
        |   |       GithubActionsMonitor.jsx
        |   |       MongodbMonitor.jsx
        |   |       ServiceDriveMonitor.jsx
        |   |       
        |   +---notifications
        |   |       NotificationAutoRegister.jsx
        |   |       NotificationForm.jsx
        |   |       NotificationHistory.jsx
        |   |       
        |   +---payment
        |   |       PaymentForm.jsx
        |   |       PaymentHistory.jsx
        |   |       PaymentReceipt.jsx
        |   |       
        |   +---profile
        |   |       GoogleLinkButton.jsx
        |   |       PasswordChangeForm.jsx
        |   |       PhoneInput.jsx
        |   |       ProfileDetails.jsx
        |   |       ProfileImageDialog.jsx
        |   |       ProfileOTPVerification.jsx
        |   |       SessionsManager.jsx
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
        |   |       Overview.jsx
        |   |       StatsEnglishPrint.jsx
        |   |       StatsTeluguPrint.jsx
        |   |       
        |   +---techstack
        |   |       Access.jsx
        |   |       MindMap.jsx
        |   |       Technologies.jsx
        |   |       
        |   +---tools
        |   |       Calculator.jsx
        |   |       LocationControls.jsx
        |   |       PdfMerger.jsx
        |   |       Stopwatch.jsx
        |   |       Toss.jsx
        |   |       Weather.jsx
        |   |       WeatherDisplay.jsx
        |   |       
        |   +---users
        |   |       DeleteUserForm.jsx
        |   |       UpdateUserForm.jsx
        |   |       UserStats.jsx
        |   |       
        |   +---verification
        |   |       VerificationTable.jsx
        |   |       
        |   +---vibe
        |   |       CollectionItem.jsx
        |   |       CollectionManager.jsx
        |   |       FloatingMusicIcon.jsx
        |   |       MusicPlayer.jsx
        |   |       SongItem.jsx
        |   |       UploadToCollection.jsx
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
        |       
        +---layouts
        |       AuthLayout.jsx
        |       DashboardLayout.jsx
        |       
        +---pages
        |       Activities.jsx
        |       ActivityLogs.jsx
        |       AdminPanel.jsx
        |       AuthSessions.jsx
        |       Committee.jsx
        |       DeveloperOptions.jsx
        |       Estimation.jsx
        |       Expense.jsx
        |       Histories.jsx
        |       Home.jsx
        |       Income.jsx
        |       Maintenance.jsx
        |       Moments.jsx
        |       Monitor.jsx
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
        |       Tools.jsx
        |       Users.jsx
        |       Verification.jsx
        |       Vibe.jsx
        |       vini.jsx
        |       
        +---stores
        |       useMusicStore.js
        |       
        \---utils
                access.js
                analytics.js
                cloudinaryUpload.js
                config.js
                dateTime.js
                deviceInfo.js
                firebase.js
                notifications.js
                songQueue.js
                vapidKeys.js

                
tree /F /A  > directory_structure.txt
