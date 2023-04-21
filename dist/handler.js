var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const handlePrismaQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { model, action, query, db, count } = params;
    const queryFn = query
        ? () => db[model][action](query)
        : () => db[model][action]();
    if (count) {
        const [_count, data] = yield db.$transaction([
            db[model].count((query === null || query === void 0 ? void 0 : query.where) ? { where: query.where } : undefined),
            queryFn(),
        ]);
        return { _count, data };
    }
    else {
        const data = yield queryFn();
        return data;
    }
});
//# sourceMappingURL=handler.js.map