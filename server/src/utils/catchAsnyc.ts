const catchAsync = (fn: (...args: any[]) => Promise<any>) => {
    return (req: any, res: any, next: any) => {
        fn(req, res, next).catch(next);
    };
};

export default catchAsync;