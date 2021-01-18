# Infominer Backend

The (semi-)automatic data exploration and topic ontology creation tool.

## Prerequities

-   NodeJS version 10 or greater

    To test that your nodejs version is correct, run `node --version` in the command line.

-   Docker version 10 or higher, docker-compose v1.23 or higher (required only for setting postgres with docker)
-   Postgres version 10 or greater (required only if one will not spin up a postgres docker container)

## TL;DR

1. Install the nodejs dependencies and create the **.env** file in the [./env](/env) folder (see [Installation](#installation)).
   For the **.env**, just copy what it says in the [README](./env/README.md).

2. Start the database and infominer backend containers by running:

    ```bash
    sudo docker-compose up -d
    ```

3. Configure the postgres database schema by running:

    ```bash
    node ./load/upgrade
    ```

4. Access the backend on `localhost:8100`. See WIKI for API documentation.

## Installation

-   **Install the nodejs dependencies**

    ```bash
    npm install
    ```

-   **Create the `.env` file in the [./env][env] folder and configure it accordingly**

    **NOTE:** If setting up the postgres docker container make sure to use the **TARGET** port
    (see [Database Configuration](#database-configuration)).

## Database Configuration

This repository contains the code used to create the infominer database.
While the advised approach is to create a [postgres docker container][postgres-docker],
one can set up and install the [postgres database][postgres-manual].

1.  **(optional) Start the postgres docker container**

    -   Modify the following fields in [docker-compose.yml][docker-compose]:

        **POSTGRES_PASSWORD**: make sure it is secure.

        (optional) **ports**: This value sets the mapping/tunnel between the container and system.
        The format is `TARGET:CONTAINER` where **TARGET** is the port number of the system which
        is redirected to the containers port number **CONTAINER**. This will enable the user to
        access the database through the **TARGET** port. If required, modify the **TARGET** port number,
        i.e. `4110`.

    -   Up a new postgres container:

        ```bash
        sudo docker-compose up -d postgres
        ```

        This will start the postgres container. Check if it is running with:

        ```bash
        sudo docker ps
        ```

        The response should be something like this:

        ```bash
        CONTAINER ID  IMAGE        COMMAND                 CREATED        STATUS        PORTS                   NAMES
        52ac627f9966  postgres:13  "docker-entrypoint.s…"  5 seconds ago  Up 4 seconds  0.0.0.0:4110->5432/tcp  postgres
        ```

    -   Stop the postgres container:

        ```bash
        sudo docker-compose stop postgres
        ```

    -   Start the postgres container:

        ```bash
        sudo docker-compose start postgres
        ```

    -   Stop and remove the postgres container:

        ```bash
        sudo docker-compose rm -s postgres
        ```

    **Data Persistence.** The data stored in the postgres database via docker will be persistent.
    The **volumes** configuration are setup so that the database is stored in one of the volumes
    found in **/var/lib/docker/volumes** folder (in this case it will be named `infominer-backend_pgdata`).
    If one would stop the container and run it again it will take the data found in the defined
    volume.

    To remove the persistent volume from the machine, one can follow these steps. **NOTE:** Before following
    the steps make sure to stop and remove the postgres container (see previous bonus point).

    1. **Identify the name of the volume.** To get the list of all docker volumes run the following command:

        ```bash
        sudo docker volume ls
        ```

        This will output all of the docker volumes:

        ```bash
        DRIVER  VOLUME NAME
        local   infominer-backend_pgdata
        ```

        The infominer database is named `infominer-backend_pgdata`.

    2. **Delete the docker volume.** To remove the volume run:

        ```bash
        sudo docker volume rm infominer-backend_pgdata
        ```

2.  **Initialize the database tables.** To initialize the table simply run the following command:

    ```bash
    node ./load/upgrade
    ```

    This will create the required infominer tables. The table definitions are defined in files found in
    the [./load/postgres][postgres-defs] folder.

3.  **Downgrading the database tables.** To remove all of the database tables simply run the following
    command:

    ```bash
    node ./load/downgrade
    ```

## Start

To start the project run the following command:

```bash
# run in development:watch mode (respawns the service when changes in file happen)
npm run start:watch
# run in development mode
npm start
```

The service will be accessible via `localhost:8100` (this is true throughout the readme).

## Build

To build the project run the following command:

```bash
npm run build
```

## Deploy

To build and run the service in production mode run the the following command:

```bash
npm run deploy
```

If the project is already built one can also start it with:

```bash
node ./dist/server
```

### PM2 - NodeJS Process Manager

To run Infominer in a more production setting one can use [PM2][pm2], a NodeJS process manager. To install
it simply run

```bash
# install PM2 as a global library
npm install pm2 -g
```

Once the installation is complete, one can configure the [ecosystem.config.yml](./ecosystem.config.yml) file.
Assuming that the backend has been built (`npm run build`) running the infominer backend in production mode
can be done with the following command:

```bash
pm2 start ecosytem.config.yml
```

This will monitor the project.

## Clean

During the development process there might appear a lot of temporary files and invalid data bases.
To remove all of the temporary files, data bases, and clean the postgreSQL database, one can run:

```bash
npm run clean
```

**NOTE:** This will make the project as if no-one ever used it.

# Dockerization

To dockerize infominer simply run the following command:

```bash
# running the docker command to build the image
docker build -t infominer/backend .
# shortcut command to create the docker image (available in package.json)
npm run dockerize
```

This will create a docker image **infominer/backend** that will be stored in **docker image**.

## Start the backend container using `docker run`

One can manually run the generated docker image. Assuming
the database is running on docker (see [Database Configuration](#database-configuration)), run the
command in the terminal:

```bash
docker run \
    -p 8100:8100 \
    --name backend \
    --network infominer-backend_infominer \
    -e PG_HOST=postgres \
    -e PG_PORT=5432 \
    -e PG_USER=postgres \
    -e PG_PASSWORD=password \
    -e PG_DATABASE=infominer \
    -d infominer/backend
```

The above command sets the port mapping, assigns the network in which the docker container will run in and provide
environmental variables to infominer. Lets dissect the above command.

| command part | command value               | description                                                                         |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------- |
| `-p`         | 8100:8100                   | The **TARGET:CONTAINER** port mapping                                               |
| `--name`     | backend                     | Name of the container to be run. Used to access it instead of its **CONTAINER ID**. |
| `--network`  | infominer-backend_infominer | The network on which it runs. Same as **infominer-db** (see above).                 |
| `-e`         | PG_HOST=postgres            | _Environment Variable._ The PG host is the container name.                          |
| `-e`         | PG_PORT=5432                | _Environment Variable._ The PG port on which it is listening.                       |
| `-e`         | PG_USER=postgres            | _Environment Variable._ The PG user that will access the database.                  |
| `-e`         | PG_PASSWORD=password        | _Environment Variable._ The PG user password.                                       |
| `-e`         | PG_DATABASE=infominer       | _Environment Variable._ The PG database.                                            |
| `-d`         | infominer/backend           | Run the container in detach mode (running in the background).                       |

The environment variables (`-e`) are the same as in the `.env` file in the [./env][env] folder.

To stop and remove the backend container run:

```bash
# stop the backend container
sudo docker stop backend
# remove the backend container
sudo docker rm backend
```

## Start the backend container using `docker-compose`

To start the backend container simply run:

```bash
# up all containers that are mentioned in docker-compose.yml
sudo docker-compose up -d
# up only the backend container
sudo docker-compose up -d --build backend
```

The `--build` option is required only if you want to build the backend docker image anew. Otherwise,
it will use the old docker image version to create the container.

To stop and remove the backend container run:

```bash
# stop only the backend container
sudo docker-compose rm -s backend
# stop all of the services in docker-compose.yml
sudo docker-compose down
```

[postgres-docker]: https://hub.docker.com/_/postgres
[postgres-manual]: https://www.postgresql.org/download/
[docker-compose]: ./docker/docker-compose.yml
[env]: ./env
[postgres-defs]: ./load/postgres
[pm2]: https://pm2.io/
