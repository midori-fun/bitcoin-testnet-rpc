let bodyParser = require("body-parser");
let express = require("express");
let request = require("request");
let port = {
	http: 55000,
	ssl: 55001
};
let path = {
	users: "users.json",
	auth: "auth.json"
};

app = express();
app.disable("x-powered-by");
app.use(bodyParser.json());
app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('index');
})

app.post("/", async (req, res, next) => {
	let fs = require("fs");
	let users = JSON.parse(fs.readFileSync(path.users, "utf8"));
	let [user, pass] = 
		new Buffer(req.headers.authorization.split(/\s+/).pop(), 'base64').toString().split(/:/);
	let auth = false;

	Object.keys(users).forEach(key => {
		if (user === key && pass === users[key]) {
			auth = JSON.parse(fs.readFileSync(path.auth, "utf8"));
		}
	});

	if (auth) {
		try {
			let options = {
				uri: `http://${auth.rpcuser}:${auth.rpcpassword}@localhost:${auth.rpcport}`,
				headers: {
					"Content-type": "application/json"
				},
				json: req.body
			};
			request.post(options, (err, _res, body) => {
				res.send(body);
			});
		} catch(e) {
			res.send(JSON.stringify({
				body: "Internal Server Error on midori.fun. This is not an error of bitcoin RPC server.\n",
				statusCode: "500"
			}));
		}
	} else {
		res.send(JSON.stringify({
			body: "Access forbidden on midori.fun. This is not an error of bitcoin RPC server.\n",
			statusCode: "403"
		}));
	}
});

app.post("/curl", async (req, res, next) => {
	let method = req.body.method ? req.body.method : "getnetworkinfo";
	let params = req.body.params ? req.body.params : [];
	let rpcuser = req.body.rpcuser ? req.body.rpcuser : "rpcuser";
	let rpcpassword = req.body.rpcpassword ? req.body.rpcpassword : "rpcpassword";

	let json = {
		"jsonrpc": "1.0",
		"id": "testnet",
		"method": method,
		"params": params
	};

	let curl = `curl -H "Content-Type: application/json" -X POST ${req.protocol}://${rpcuser}:${rpcpassword}@${ req.body.host} -d '${JSON.stringify(json)}'`;
	res.send(curl);
});

let errorHandler = (err, req, res, next) => {
		console.log(err);
		res.status(500).send(err.stack);
};
app.use(errorHandler);

/**
 * Notice: You SHOULD RUN "sudo rm -rf ~/letsencrypt/etc/" when you modify here
 */
require('greenlock-express').create({ 
  server: 'https://acme-v01.api.letsencrypt.org/directory',
  email: 'jiyu@midori.fun',
  agreeTos: true,
  approveDomains: [ 'midori.fun' ],
  app: app
}).listen(port.ssl+1, port.ssl);

app.listen(port.http, () => {
	console.log(`(http) listen on :${port.http}`);
});
