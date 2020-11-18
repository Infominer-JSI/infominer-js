# Environment Variables

To avoid storing vulnerable data in the repository (such as authentication tokens
and secrets) we have adopted the `.env` approach to feed the vulnerable data to
different components of the platform.

This approach requires the `dotenv` module (which is installed by running the
`npm install` command) and an `.env` file saved in this folder. **One must create the
`.env` file by hand since it is ignored in the project.**

### .env File Structure

What follows is an example of the `.env` file structure. The values behind the
equal sign are the default values used by Infominer. Values associated with the
curly brackets do not have a default value and must be modified by the user.

```bash
#######################################
### PostgreSQL Configuration
#######################################

PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=infominer
PG_USERNAME=postgres
PG_PASSWORD={password}
PG_CONNECTION_TIMEOUT=3000

```
