var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const messages = {
    P2002: "Name must be unique.",
};
export const handlePrismaQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { model, action, query, db, count } = params;
        const queryFn = query
            ? // @ts-ignore
                () => db[model][action](query)
            : // @ts-ignore
                () => db[model][action]();
        if (count) {
            const [_count, data] = yield db.$transaction([
                // @ts-ignore
                db[model].count((query === null || query === void 0 ? void 0 : query.where) ? { where: query.where } : undefined),
                queryFn(),
            ]);
            return { _count, data };
        }
        else {
            const data = yield queryFn();
            return data;
        }
    }
    catch (error) {
        // @ts-ignore
        const message = (_a = messages[error === null || error === void 0 ? void 0 : error.code]) !== null && _a !== void 0 ? _a : "Something went wrong.";
        // @ts-ignore
        return { error: message };
    }
});
//# sourceMappingURL=handler.js.map