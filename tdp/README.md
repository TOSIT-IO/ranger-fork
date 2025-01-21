# TDP Ranger Notes

The version 2.6.0-1.0 of Apache Ranger is based on the `ranger-2.6.0-rc0` release of the Apache [repository](https://github.com/apache/ranger/releases/tag/release-2.6.0-rc0).

## Jenkinfile

The file `./Jenkinsfile-sample` can be used in a Jenkins / Kubernetes environment to build and execute the unit tests of the Hive project. See []() for details on the environment.

## Making a release

```
mvn clean install -DskipTests -Drat.numUnapprovedLicenses=1000
```

The Ranger Admin and all the plugins in the `target` directory:

- ranger-2.6.0-1.0-admin.tar.gz
- ranger-2.6.0-1.0-atlas-plugin.tar.gz
- ranger-2.6.0-1.0-elasticsearch-plugin.tar.gz
- ranger-2.6.0-1.0-hbase-plugin.tar.gz
- ranger-2.6.0-1.0-hdfs-plugin.tar.gz
- ranger-2.6.0-1.0-hive-plugin.tar.gz
- ranger-2.6.0-1.0-kafka-plugin.tar.gz
- ranger-2.6.0-1.0-kms.tar.gz
- ranger-2.6.0-1.0-knox-plugin.tar.gz
- ranger-2.6.0-1.0-kylin-plugin.tar.gz
- ranger-2.6.0-1.0-migration-util.tar.gz
- ranger-2.6.0-1.0-ozone-plugin.tar.gz
- ranger-2.6.0-1.0-presto-plugin.tar.gz
- ranger-2.6.0-1.0-ranger-tools.tar.gz
- ranger-2.6.0-1.0-solr-plugin.tar.gz
- ranger-2.6.0-1.0-solr_audit_conf.tar.gz
- ranger-2.6.0-1.0-sqoop-plugin.tar.gz
- ranger-2.6.0-1.0-src.tar.gz
- ranger-2.6.0-1.0-storm-plugin.tar.gz
- ranger-2.6.0-1.0-tagsync.tar.gz
- ranger-2.6.0-1.0-usersync.tar.gz
- ranger-2.6.0-1.0-yarn-plugin.tar.gz

## Testing parameters

```
mvn test -T 4 -DforkCount=4 -Dsurefire.rerunFailingTestsCount=3 --fail-never
```

- -Drat.numUnapprovedLicenses=1000: Workaround for the `tdp` files to be ignored by Apache Rat
- -DforkCount=4: Fork count for the maven-surefire-plugin, defaults to 1
- -Dsurefire.rerunFailingTestsCount: Retries failed test
- --fail-never: Does not interrupt the tests if one module fails

## Build notes

### Ranger 2.6.0-1.0 with Hadoop 3.3.6-1.0:

- Commit `01a2d80ca8342038f3bfdba659b8eb93679ff0ac` ads the dependency `ranger-plugin-cred` in the library of the Usersync package, otherwise the user syncronysation does not work.

- Commit `8c60e52fa69d6326ab554f56b828429d1627e12d` adds the `zookeeper-jute` dependency for the KMS which otherwise fails to run properly.

- Commit `b6c65f384f95a50039efe717a31a316740d5bc09` modifies the Hive plugin in order to work with Hive4.Variables have been renamed as well as operations have been replaced. 
