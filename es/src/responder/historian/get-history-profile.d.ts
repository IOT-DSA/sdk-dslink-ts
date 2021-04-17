declare const profile: {
    $invokable: string;
    $result: string;
    $params: ({
        name: string;
        type: string;
        editor: string;
    } | {
        name: string;
        type: string;
        editor?: undefined;
    })[];
    $columns: {
        name: string;
        type: string;
    }[];
};
export default profile;
