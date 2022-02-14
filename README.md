# Matomo Analytics App for Enonic XP

This app enables Matomo analytics for a site.

![Build status](https://github.com/bouvet/app-matomo/actions/workflows/enonic-gradle.yml/badge.svg)

Here's the documentation for this application:

* [Installing the App](docs/installing.md)


## Releases and Compatibility

| App version | Required XP version | Download |
| ----------- | ------------------- | -------- |
| 1.0.0 | 7.5.0 | Clone and build this repo |

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
