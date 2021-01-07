# Infominer Backend

The (semi-)automatic data exploration and topic ontology creation tool.

## Prerequities

-   NodeJS version 10 or greater

    To test that your nodejs version is correct, run `node --version` in the command line.

-   Docker version 10 or higher, docker-compose v1.23 or higher (required only for setting postgres with docker)
-   Postgres version 10 or greater (required only if one will not spin up a postgres docker container)

## Installation

-   **Install the nodejs dependencies**

    ```bash
    npm install
    ```

-   **Create the `.env` file in the [./env][env] folder and configure it accordingly**

    **NOTE:** If one setup the postgres docker container make sure to use the `TARGET` port
    (see Database Configuration).

## Database Configuration

This repository contains the code used to create the infominer database.
While the advised approach is to create a [postgres docker container][postgres-docker],
one can set up and install the [postgres database][postgres-manual].

-   **(optional) Start the postgres docker container**

    -   Navigate into the docker folder

        ```bash
        cd ./docker
        ```

    -   Modify the following fields in [docker-compose.yml][docker-compose]:

        -   `POSTGRES_PASSWORD`: make sure it is secure

        -   (optional) `ports`: This value sets the mapping/tunnel between the container and system.
            The format is `TARGET:CONTAINER` where `TARGET` is the port number of the system which
            is redirected to the containers port number `CONTAINER`. This will enable the user to
            access the database through the `TARGET` port. If required, modify the `TARGET` port number,
            i.e. `5440`.

    -   Start the containers:

        ```bash
        sudo docker-compose up -d
        ```

        This will start the postgres docker container. One can check if it is running with

        ```bash
        sudo docker ps
        ```

        The response should be something like this:

        ```bash
        CONTAINER ID  IMAGE        COMMAND                 CREATED      STATUS      PORTS                   NAMES
        52ac627f9966  postgres:13  "docker-entrypoint.s…"  2 hours ago  Up 2 hours  0.0.0.0:5440->5432/tcp  docker_infominer_db_1
        ```

    -   Navigate to the project root

        ```bash
        cd ../
        ```

    **Data Persistence.** The data stored in the postgres database via docker will be persistent.
    The `volumes` configuration are setup so that the database is stored in one of the volumes
    found in `/var/lib/docker/volumes` folder (in this case it will be named `docker_infominer_db-data`).
    If one would stop the container and run it again it will take the data found in the defined
    volume.

-   **Initialize the database tables**

    To initialize the table one must simply run the following command:

    ```bash
    node ./load/upgrade
    ```

    This will create the required infominer tables. The table definitions are defined in files found in
    the [./load/postgres][postgres-defs] folder.

## Start

To start the project run the following command:

```bash
npm run start:dev
```

## Build

To build the project run the following command:

```bash
npm run build
```

[postgres-docker]: https://hub.docker.com/_/postgres
[postgres-manual]: https://www.postgresql.org/download/
[docker-compose]: ./docker/docker-compose.yml
[env]: ./env
[postgres-defs]: ./load/postgres
