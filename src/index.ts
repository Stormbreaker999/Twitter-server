import { initServer } from "./app/index";
import * as dotenv from "dotenv";

const env = dotenv.config();

const init = async () => {
	const app = await initServer();
	app.listen(5000, () => console.log("server started on port 5000"));
};

init();