# personal-finance-system
A web application for documenting, categorizing, and analyzing personal expenses.

## STEPS FOR PIS DOCKER INSTALLATION

STEP 0 (OPEN POWERSHELL IN PROJECT DIRECTORY)

STEP 1 (REMOVE ALL IMAGES AND VOLUMES):

`docker compose down -v`

STEP 2 (START DOCKER COMPOSE FILE):

`docker compose up`     

STEP 3 (OPEN NEW POWERSHELL):


STEP 4 (CHECK IF CONTAINERS AND NETWORK IS WORKING):

`docker ps`
`docker network ls`


STEP 5 (SET UP PRIMARY NODE FOR REPLICAS):

`docker exec -it mongo1 mongosh`
```
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
```

STEP 6 (CHECK PRIMARY NODE):

`rs.status()`
`exit`

STEP 7 (MAKE ADMIN USER):

`docker exec -it mongo1 mongosh`
`use admin`
`db.createUser({user: "admin", pwd: "12345", roles: [{ role: "root", db: "admin" }]})`
`exit`

STEP 8 (RESTORE MONGO DUMP DATABASE):

`docker compose -f docker-compose-restore_dump.yml up`

STEP 9 (SET UP LOGGING (OPEN NEW POWERSHELL)):

`docker compose -f docker-compose-elk.yml up -d`

STEP 10 (SET UP BACKEND):

`docker compose -f docker-compose-backend.yml up --build`

STEP 11 (SET UP LOAD BALANCING (OPEN NEW POWERSHELL)):

`docker compose -f docker-compose-backend.yml up --scale backend=3`

STEP 12 (CHECK CONNECTION TO DATABASE):

`mongodb://admin:12345@localhost:27019/?authSource=admin&replicaSet=rs0&directConnection=true`

STEP 13 (CHECK LOGGING):

http://localhost:5601/app/discover#/

STEP 14 (TYPE THESE VALUES INTO THE FIELDS)

Name: 
logs-*

Index pattern:
logs-*

Timestamp field
@timestamp

CLICK "Save data view to Kibana"

STEP 15 (CHECK BACKEND):

http://localhost:8090






## DEVELOPER ONLY

DATABASE DUMPING

(OPEN TERMINAL IN C:\Program Files\MongoDB\Tools\100\bin)

`.\mongodump.exe --uri="mongodb://admin:12345@localhost:27019/pis?authSource=admin&authMechanism=SCRAM-SHA-256" --out C:\mongo_dump`
