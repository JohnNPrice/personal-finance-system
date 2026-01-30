# personal-finance-system
A web application for documenting, categorizing, and analyzing personal expenses.

## Steps for pis docker installation

Step 0 (open powershell in project directory)

Step 1 (remove all images and volumes):

`docker compose down -v`

Step 2 (start docker compose file):

`docker compose up`     

Step 3 (open new powershell):


Step 4 (check if containers and network is working):

`docker ps`
`docker network ls`


Step 5 (set up primary node for replicas):

`docker exec -it mongo1 mongosh`
```
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017",  priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
```

Step 6 (check primary node):

`rs.status()`
`exit`

Step 7 (make admin user):

`docker exec -it mongo1 mongosh`

`use admin`

`db.createUser({user: "admin", pwd: "12345", roles: [{ role: "root", db: "admin" }]})`

`exit`

Step 8 (restore mongo dump database):

`docker compose -f docker-compose-restore_dump.yml up`

Step 9 (set up logging (open new powershell)):

`docker compose -f docker-compose-elk.yml up -d`

Step 10 (set up backend):

`docker compose -f docker-compose-backend.yml up --build`

Step 11 (set up load balancing (open new powershell)):

`docker compose -f docker-compose-backend.yml up --scale backend=3`

Step 12 (check connection to database): *if using MongoDB for VS Code extension

`mongodb://admin:12345@localhost:27019/?authSource=admin&replicaSet=rs0&directConnection=true`

Step 13 (check logging):

http://localhost:5601/app/discover#/

Step 14 (type these values into the fields):

Name: 

logs-*

Index pattern:

logs-*

Timestamp field:

@timestamp:

CLICK "Save data view to Kibana"

Step 15 (check backend):

http://localhost:8090






## DEVELOPER ONLY

DATABASE DUMPING

(OPEN TERMINAL IN C:\Program Files\MongoDB\Tools\100\bin)

`.\mongodump.exe --uri="mongodb://admin:12345@localhost:27019/pis?authSource=admin&authMechanism=SCRAM-SHA-256" --out C:\mongo_dump`
