# Matomo Analytics App for Enonic XP

This app enables Matomo analytics for a site.

![Build status](https://github.com/bouvet-apps/app-matomo/actions/workflows/enonic-gradle.yml/badge.svg)

Here's the documentation for this application:

* [Installing the App](docs/installing.md)


## Upgrade Notes: Tracking Consent Changes

The "Disable tracking cookies" has been removed. In it's place several different tracking consent options have been added. If you have "Disable tracking cookies" enabled, then the default "Cookie consent required" option will behave the same way, as it will enable user tracking but will not set any cookies unless consent has been given.

If you do not have "Disable tracking cookies" enabled, then you can consider setting the "No consent required" option, as this will allow user tracking with tracking cookies. Keep in mind that this option will set tracking cookies without any user consent, so this option is likely not compliant with local GDPR laws within the EU.

The third option "Tracking consent required" will not allow any sort of tracking and thus also won't set any cookies unless consent has been given.

If you wish to integrate any sort of consent manager, you can make it run `window.__RUN_ON_COOKIE_CONSENT__["no-bouvet-app-matomo_disabled"]();` in the front-end when a user gives consent or on page load if a user has given consent before. When running this function on pageload, make sure it runs after the function has been set on the window by the Matomo.js script.

Read more about the new options [here](https://github.com/bouvet-apps/app-matomo/blob/develop/docs/installing.md#tracking-cookies-and-consent)


## Releases and Compatibility

| App version | Required XP version | Download |
| ----------- | ------------------- | -------- |
| 2.0.1 | >= 7.14.4 | Clone and build this repo |

## Building and deploying with the Gradle wrapper

Build this application from the command line. Go to the root of the project and enter:

    ./gradlew clean build

To deploy the app, set `$XP_HOME` environment variable and enter:

    ./gradlew deploy

## Building and deploying with Enonic CLI

Build this application from the command line. Go to the root of the project and enter:

    enonic project build

To deploy the app, simply enter:

    enonic project deploy

## Releasing a new version

To release a new version of this app, please follow the steps below:

1. Update `version` (and possibly `xpVersion`) in  `gradle.properties`.

2. Compile and deploy to our Maven repository:

    ./gradlew clean build uploadArchives

3. Update `README.md` file with new version information and compatibility.

4. Tag the source code using `git tag` command (where `X.X.X` is the released version):

    git tag vX.X.X

5. Update `gradle.properties` with the next snapshot version and commit changes.

6. Push the updated code to Git.

    git push origin master --tags
