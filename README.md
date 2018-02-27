# df-filemanager-app
Standalone File Manager application for DreamFactory file services based on [this](https://github.com/joni2back/angular-filemanager).

This app runs in an iframe inside the Files tab of the admin app or, when opened from LaunchPad, in a new browser tab. In LaunchPad the File Manager can be selected from the list of available apps. File Manager is always part of the default DreamFactory installation, accessed from /filemanager/index.html.

The purpose of the app is to display a list of available file storage services, allowing the user to navigate the folders. You can create or delete files and folders. You can download files, and it also includes the ACE editor for editing text files.

Here is how it gets launched from the Files tab of the admin app:

```
$( "#root-file-manager iframe" ).attr( "src", INSTANCE_BASE_URL + '/filemanager/index.html?path=/&allowroot=true').show();
```

From LaunchPad, the file manager is launched using the app URL:

```
$window.open(app.url);
```

This opens a new browser tab.

The app starts by loading the file services and displaying them as the top level list. This mode is triggered by the allowroot=true query param. If you select a file service from the list then it queries the selected service as you navigate through the folders for that service. There used to be a mode where it would show only the files and folders for a single service and allowroot would be set to false. This mode is no longer used.

If you are in the admin app and click the Files tab, you want to launch the File Manager in an iframe and have it pick up the session previously established by the admin app. It first checks for session_token as an explicit query param, then checks for a cookie named 'CurrentUserObj' in window.parent. The Files tab is the parent of the File Manager iframe. 'CurrentUserObj' is the name of the cookie stored by the admin app when a user logs in. If you are in LaunchPad the file manager gets launched in new window, and it looks for the cookie in window.opener. In either case, if that cookie exists it grabs the session_token out of the session info. This token will be used in subsequent API calls made by the file manager, along with the hardcoded API key.

### Build Process

The structure and deployment of this app is not very good. The code is all under /js and there is no build process in place like there is for the admin app and API docs app. In other words there is no 'app' or 'dist' version. You are just editing and running the code under /js as is.

### Release Process

Use git flow to do releases. This will merge all changes from develop branch into master with a tag. Let's say you are going from 0.3.0 to 0.4.0.

```
git flow release start 0.4.0
```

To do a release of the File Manager you need to bump the version number in composer.json. The next version would be 0.4.x-dev.

```
"extra": {
    "branch-alias":   {
        "dev-develop": "0.4.x-dev"
    },
    "installer-name": "filemanager"
}
```

```
git add --all
git commit -m "Release 0.4.0"
git flow release finish 0.4.0
git push origin develop
git checkout master
git push origin master
git push --tags
```

### Adding new file storage service types

If you add a new type of file storage service to DreamFactory, those services will show up in File Manager without requiring any changes. When it queries the list of services it looks for all services where group is set to 'File'. Note that for non-admin users /api/v2 will only return services that your role grants access to.

```
url: CurrentServer + '/api/v2?group=File'
```



