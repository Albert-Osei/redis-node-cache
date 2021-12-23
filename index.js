import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';


const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Create redis client
const client = redis.createClient(REDIS_PORT);

const app = express();

// Set Response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make request to Github for data
async function getRepos(req, res, next) {
    try {
        console.log('Fetching Data...');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();

        const repos = data.public_repos;

        // Set data to Redis
        client.setEx(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (err) {
        console.log(err);
        res.status(500);
    }
}

// Cache middleware
function cache(req, res, next) {
    const { username } = req.params;

    client.get(username, (err, data) => {
        if(err) throw err;

        if(data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}

// Function take will run when a specific route is hit
app.get('/repos/:username', cache, getRepos);

app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`)
});

