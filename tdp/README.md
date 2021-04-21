# TDP Ranger Notes

The version 2.0.0-1.0 of Apache Ranger is based on the `ranger-2.0` branch of the Apache [repository](https://github.com/apache/ranger/tree/ranger-2.0).

## Jenkinfile

The file `./Jenkinsfile-sample` can be used in a Jenkins / Kubernetes environment to build and execute the unit tests of the Hive project. See []() for details on the environment.

## Making a release

```
mvn clean install assembly:assembly -DskipTests -Drat.numUnapprovedLicenses=1000
```

The parameter `assembly:assembly` generates `.tar.gz` files for the Ranger Admin and all the plugins in the `target` directory:

- ranger-2.0.0-1.0-admin.tar.gz
- ranger-2.0.0-1.0-atlas-plugin.tar.gz
- ranger-2.0.0-1.0-elasticsearch-plugin.tar.gz
- ranger-2.0.0-1.0-hbase-plugin.tar.gz
- ranger-2.0.0-1.0-hdfs-plugin.tar.gz
- ranger-2.0.0-1.0-hive-plugin.tar.gz
- ranger-2.0.0-1.0-kafka-plugin.tar.gz
- ranger-2.0.0-1.0-kms.tar.gz
- ranger-2.0.0-1.0-knox-plugin.tar.gz
- ranger-2.0.0-1.0-kylin-plugin.tar.gz
- ranger-2.0.0-1.0-migration-util.tar.gz
- ranger-2.0.0-1.0-ozone-plugin.tar.gz
- ranger-2.0.0-1.0-presto-plugin.tar.gz
- ranger-2.0.0-1.0-ranger-tools.tar.gz
- ranger-2.0.0-1.0-solr-plugin.tar.gz
- ranger-2.0.0-1.0-solr_audit_conf.tar.gz
- ranger-2.0.0-1.0-sqoop-plugin.tar.gz
- ranger-2.0.0-1.0-src.tar.gz
- ranger-2.0.0-1.0-storm-plugin.tar.gz
- ranger-2.0.0-1.0-tagsync.tar.gz
- ranger-2.0.0-1.0-usersync.tar.gz
- ranger-2.0.0-1.0-yarn-plugin.tar.gz

## Testing parameters

```
mvn test -T 4 -DforkCount=4 -Dsurefire.rerunFailingTestsCount=3 --fail-never
```

- -Drat.numUnapprovedLicenses=1000: Workaround for the `tdp` files to be ignored by Apache Rat
- -DforkCount=4: Fork count for the maven-surefire-plugin, defaults to 1
- -Dsurefire.rerunFailingTestsCount: Retries failed test
- --fail-never: Does not interrupt the tests if one module fails

## Build notes

### Ranger 2.0.0-1.0 with Hadoop 3.1.1-0.0:

Seems OK.

### Ranger 2.1:

Fails with:

Caused by: java.io.FileNotFoundException: JAR entry META-INF/MANIFEST.MF not found in /tdp/ranger/security-admin/target/security-admin-web-2.1.1-SNAPSHOT.war

https://issues.apache.org/jira/browse/RANGER-3072

### Ranger 2.2:

Fails with:

[ERROR] /tdp/ranger/ranger-presto-plugin-shim/src/main/java/org/apache/ranger/authorization/presto/authorizer/RangerSystemAccessControlFactory.java:[24] error: cannot find symbol
[ERROR]   symbol:   static throwIfUnchecked
  location: class
/tdp/ranger/ranger-presto-plugin-shim/src/main/java/org/apache/ranger/authorization/presto/authorizer/RangerSystemAccessControlFactory.java:[57,6] error: cannot find symbol

https://issues.apache.org/jira/browse/RANGER-3243

## Test execution notes

See `./test_notes.txt`
