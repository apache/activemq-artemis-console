## Generating the licenses for the NPM dependencies

Before a release can be performed the npm license need to be updated with any new dependencies. This file is found under `artemis-console-distribution/src/main/resources/licenses/licenses/NPMLicenses.txt`.

To regenerate the licenses cd into `artemis-console-extension/artemis-extension` and run

```shell
yarn license
```

Note that a check can be made to identify any possible problematic licenses by running in the `artemis-console-extension/artemis-extension` directory:

```shell
npx license-checker --out licenses.csv --csv --onlyAllow "Apache-2.0;ISC;MIT;CC0-1.0;BSD-2-Clause;BSD-3-Clause;Python-2.0;UNLICENSED;MPL-2.0;CC-BY-4.0;Unlicense;0BSD;Custom: https://jolokia.org"
```

dependencies marked as unlicensed will need to be manually checked.

## Checking out a new empty git repository

Before starting make sure you clone a brand new git as follows as the release plugin will use the upstream for pushing the tags:

```sh
git clone https://gitbox.apache.org/repos/asf/activemq-artemis-console.git
cd activemq-artemis-console
```

If your git `user.email` and/or `user.name` are not set globally then you'll need to set these on the newly clone
repository as they will be used during the release process to make commits to the upstream repository, e.g.:

```
git config user.email "username@apache.org"
git config user.name "FirstName LastName"
```

This should be the same `user.email` and `user.name` you use on your main repository.

## Running the release

You will have to use this following maven command to perform the release:

```sh
mvn clean release:prepare -Prelease
```

You could optionally set `pushChanges=false` so the version commit and tag won't be pushed upstream (you would have to do it yourself):

```sh
mvn clean release:prepare -DpushChanges=false -Prelease
```

When prompted make sure the new development version matches with the next expected release, rather than the offered patch release. Example:

```
[INFO] Checking dependencies and plugins for snapshots ...
What is the release version for "ActiveMQ Artemis Console Project"? (artemis-console-project) 1.0.0: :
What is the SCM release tag or label for "ActiveMQ Artemis Console Project"? (artemis-console-project) 1.0.0: :
What is the new development version for "ActiveMQ Artemis Console Project"? (artemis-console-project)1.0.1-SNAPSHOT: : 1.1.0-SNAPSHOT
```

For more information look at the prepare plugin:

- https://maven.apache.org/maven-release/maven-release-plugin/prepare-mojo.html#pushChanges

If you set `pushChanges=false` then you will have to push the changes manually.  The first command is to push the commits
which are for changing the `&lt;version>` in the pom.xml files, and the second push is for the tag, e.g.:

```sh
git push upstream
git push upstream <version>
```

## Uploading to nexus

Ensure that your environment is ready to deploy to the ASF Nexus repository as described at
[Publishing Maven Artifacts](https://infra.apache.org/publishing-maven-artifacts.html)

Copy the file release.properties, that is generated at the root of the project during the release,
before starting the upload. You could need it if the upload fails.

To upload it to nexus, perform this command:

```sh
mvn release:perform -Prelease
```

Note: this can take quite a while depending on the speed for your Internet connection.
If the upload fails or is interrupted, remove the incomplete repository
using the "Drop" button on [Nexus website](https://repository.apache.org/#stagingRepositories).
Before starting the upload again, check the release.properties at the root of the project.

**_Keep the checkout used to run the release process for later, the website update scripts will reference it for documentation output._**


### Resuming release upload

If something happened during the release upload to nexus, you may need to eventually redo the upload.
Remove the incomplete repository using the "Drop" button on [Nexus website](https://repository.apache.org/#stagingRepositories).
Before starting the upload again, check the release.properties at the root of the project.

There is a release.properties file that is generated at the root of the project during the release.
In case you want to upload a previously tagged release, add this file as follows:

- release.properties
```
scm.url=scm:git:https://github.com/apache/activemq-artemis-console.git
scm.tag=1.0.0
```

## Closing the staging repository

Give the staging repository contents a quick inspection using the content navigation area, then proceed to close the
staging repo using the "Close" button on Nexus website, locking it from further modification and exposing its contents
at a staging URL to allow testing. Set a description such as "ActiveMQ Artemis Console <version> (RC1)" while closing.

## Stage the release to the dist dev area

Use the closed staging repo contents to populate the dist dev svn area
with the official release artifacts for voting. Use the script already present
in the repo to download the files and populate a new ${CURRENT-RELEASE} dir:

```sh
svn co https://dist.apache.org/repos/dist/dev/activemq/activemq-artemis-console/
cd activemq-artemis-console
./prepare-release.sh https://repository.apache.org/content/repositories/orgapacheactivemq-${NEXUS-REPO-ID} ${CURRENT-RELEASE}
```

Give the files a check over and commit the new dir and start a vote if all looks well.

```bash
svn add <version>
svn commit
```

Old staged releases can be cleaned out periodically.

## Send Email

Once all the artifacts are stage then send an email to `dev@activemq.apache.org`.  It should have a subject like `[VOTE]
Apache ActiveMQ Artemis Console <version>`. 

## Voting process

Rules for the Apache voting process are stipulated [here](https://www.apache.org/foundation/voting.html).

Assuming the vote is successful send a email with a subject like `[RESULT] [VOTE] Apache ActiveMQ Artemis Console <version>`
informing the list about the voting result.

## Web site update:

Wait for the CDN to sync first after updating SVN, and additionally for Maven Central to sync, before proceeding.

The CDN content can be viewed [here](https://dlcdn.apache.org/activemq/activemq-artemis-console/).
The Maven Central content can be viewed [here](https://repo1.maven.org/maven2/org/apache/activemq/).


Clone the activemq-website repository:

```sh
git clone https://gitbox.apache.org/repos/asf/activemq-website.git
cd activemq-website
```

**NOTE**: Some of the release scripts use [Python](https://www.python.org/), ensure you have it installed before proceeding.
Also, the [PyYAML](https://pyyaml.org/wiki/PyYAMLDocumentation) lib is used. Examples for installing that include
using `dnf install python3-pyyaml` on Fedora, or installing it using Pip by running `pip install pyyaml`.

Once the CDN and Maven Central are up-to-date then update the site as follows:

1. Run the release addition script to generate/perform most of the updates by running command of form:
```
./scripts/release/add-artemis-console-release.sh <new-version>
```

This does the following:
- Creates the new release collection file at `src/_artemis_console_releases/artemis-console-<padded-version-string>.md`.
- Creates the new release notes file at `src/components/artemis-console/download/release-notes-<new-version>.md`.

Example from the 1.0.0 release:
```
./scripts/release/add-artemis-console-release.sh 1.0.0
```
2. Open the release collection file at `src/_artemis_console_releases/artemis-<padded-version-string>.md` and update _shortDescription_ as appropriate to the release content.
3. Update the *artemis_console* list within the `src/_data/current_releases.yml` file if needed to set the new version stream as current.

Check over `git status` etc. Run `git add` for all the added directories & files and then `git commit -m "updates for artemis-console <version> release"`.
Once pushed, the changes should be published automatically by the `jekyll_websites` builder of the [apache buildbot](https://ci2.apache.org/#/builders).

