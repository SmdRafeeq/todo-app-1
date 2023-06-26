const express = require("express")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const path = require("path")
const dbPath = path.join(__dirname, "todoApplication.db")

const app = express();
app.use(express.json())

let db = null

const dbConnection = async () => {
    try {
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database
        })
        app.listen(3000, () => {
            console.log("Server started at http://localhost:3000")
        })
    } catch(err) {
        console.log(`Database error is ${err.message}`)
        process.exit(1)
    }
}

dbConnection();

const hasPriorityStatusAndStatusPriorities = (reqQuery) => {
    return {
        reqQuery.priority != undefined && reqQuery.status != undefined
    }
}

const hasPriorityProperty = (reqQuery) => {
    return reqQuery.priority != undefined
}

const hasStatusProperty = (reqQuery) => {
    return reqQuery.status != undefined
}

// 1. GET API

app.get("/todos/", async (request, response) => {
    let data = null
    let getTodoQuery = ""
    const { search_q = "", priority, status } = request.query

    switch(true) {
        case hasPriorityStatusAndStatusPriorities(request.query):
            getTodoQuery = `select * from todo where todo like '%${search_q}%'
                    and status = "${status}" and priority = "${priority}";`
            break;
        
        case hasPriorityProperty(request.query) :
            getTodoQuery = `select * from todo where todo like "%${search_q}%"
                    and priority = "${priority}";`
            break;
        
        case hasStatusProperty(request.query) :
            getTodoQuery = `select * from todo where todo like "%${search_q}%"
                    and status = '${status}';`
            break;
        
        default :
            getTodoQuery = `select * from todo where todo like "%${search_q}%";`;
    }

    data = await db.all(getTodoQuery)
    response.send(data)
})

// 2. GET API 

app.get("/todos/:todoId/", async(request, response) => {
    const { todoId } = request.params

    const getTodoQuery = `select * from todo where id = ${todoId};`;

    const result = await db.get(getTodoQuery)
    response.send(result)
})

// 3. POST API

app.post("/todos/", async(request, response) => {
    const { id, todo, priority, status } = request.body
    const postTodoQuery = `insert into todo (id, todo, priority, status)
                values (${id}, "${todo}", "${priority}", "${status}");`;
    await db.run(postTodoQuery)
    response.send("Todo Successfully Added")
})

// 4. PUT API

app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params
    let updateCol = "";
    const requestBody = request.body

    switch(true) {
        case requestBody.status != undefined:
            updateCol = "Status"
            break;
        
        case requestBody.priority != undefined:
            updateCol = "Priority"
            break;

        case requestBody.todo != undefined :
            updateCol = "Todo"
            break;
    }

    const previousTodoQuery = `select * from todo where id = ${todoId}`

    const previousTodo = await db.get(previousTodoQuery)

    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status
    } = request.body

    const updateTodoQuery = `update todo set todo = "${todo}",
                            priority = "${priority}",
                            status = "${status}" where id = ${todoId};`;
    await db.run(updateTodoQuery)
    response.send(`${updateCol} Updated`)
});

// 5. DELETE TODO API

app.delete("/todos/:todoId/", async(request, response) => {
    const {todoId} = request.params
    const deleteTodoQuery = `delete from todo where id = ${todoId};`;

    await db.run(deleteTodoQuery)
    response.send("Todo Deleted")
})

module.exports = app;