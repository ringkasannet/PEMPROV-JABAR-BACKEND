"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mainRouter_1 = require("./router/mainRouter");
const mongodb_handler_1 = require("./mongodb_handler");
const dmsRouter_1 = require("./router/dmsRouter");
const asetRouter_1 = require("./router/asetRouter");
const bumdRouter_1 = require("./router/bumdRouter");
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT) || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/", mainRouter_1.router);
app.use("/dms", dmsRouter_1.dmsRouter);
app.use("/aset", asetRouter_1.asetRouter);
app.use("/bumd", bumdRouter_1.bumdRouter);
function init() {
    try {
        (0, mongodb_handler_1.initConnection)().then(() => {
            app.listen(port, () => {
                console.log(`Listen on port ${port}...`);
            });
        });
    }
    catch (error) {
        console.log(error);
    }
}
init();
//# sourceMappingURL=index.js.map