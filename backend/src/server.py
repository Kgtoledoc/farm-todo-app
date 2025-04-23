from contextlib import aynccontectmanager
from datetime import datetime
import os
import sys

from bson import ObjectId
from fastapi import FastAPI, status
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import uvicorn

from dal import ToDoDAL, ListSummary, ToDoList, ToDoListItem

COLLETION_NAME = "todo_lists"
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

@asynccontectmanager
async def lifespan(app: FastAPI):
    # Initialize the database connection
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client.get_default_database()

    # Ensure the database is available
    pong = await database.command("ping")
    if pong.get("ok") != 1:
        raise RuntimeError("Failed to connect to the database")

    todo_list = database.get_collection(COLLETION_NAME)
    app.todo_dal = ToDoDAL(todo_list)
    try:
        yield
    finally:
        # Close the database connection
        client.close()
    
app = FastAPI(lifespan=lifespan, debug=DEBUG)

@app.get("/api/lists")
async def get_all_lists() -> list[ListSummary]:
    return [i async for i in app.todo_dal.list_todo_lists()]

class NewList(BaseModel):
    name: str

class NewListResponse(BaseModel):
    id: str
    name: str

@app.post("api/lists", status_code=status.HTTP_201_CREATED, response_model=NewListResponse)
async def create_todo_list(new_list: NewList) -> NewListResponse:
    id = await app.todo_dal.create_todo_list(new_list.name)
    return NewListResponse(id=id, name=new_list.name)


@app.get("/api/lists/{list_id}", response_model=ToDoList)
async def get_todo_list(list_id: str) -> ToDoList:
    todo_list = await app.todo_dal.get_todo_list(list_id)
    if todo_list is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return todo_list


@app.delete("/api/lists/{list_id}")
async def delete_todo_list(list_id: str) -> bool:
    return await app.todo_dal.delete_todo_list(list_id)


class NewItem(BaseModel):
    label: str

class NewItemResponse(BaseModel):
    id: str
    label: str

@app.post("/api/lists/{list_id}/items", status_code=status.HTTP_201_CREATED, response_model=NewItemResponse)
async def create_todo_list_item(list_id: str, new_item: NewItem) -> NewItemResponse:
    item_id = await app.todo_dal.create_todo_list_item(list_id, new_item.label)
    return NewItemResponse(id=item_id, label=new_item.label)

@app.get("/api/lists/{list_id}/items", response_model=list[ToDoListItem])
async def get_todo_list_items(list_id: str) -> list[ToDoListItem]:
    todo_list = await app.todo_dal.get_todo_list(list_id)
    if todo_list is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return todo_list.items

@app.delete("/api/lists/{list_id}/items/{item_id}")
async def delete_todo_list_item(list_id: str, item_id: str) -> bool:
    return await app.todo_dal.delete_todo_list_item(list_id, item_id)

class ToDoItemUpdate(BaseModel):
    item_id: str | None = None
    checked_state: bool | None = None

@app.path("/api/lists/{list_id}/checked_state", methods=["PUT"])
async def set_checked_state(
    list_id: str,
    item_id: str,
    update: ToDoItemUpdate
) -> ToDoList:
return await app.todo_dal.set_checked_state(
    list_id,
    item_id,
    update.checked_state,
)


class DummyResponse(BaseModel):
    id: str
    when: datetime

@app.get("/api/dummy")
async def get_dummy() -> DummyResponse:
    return DummyResponse(id=str(ObjectId()), when=datetime.now())

def main(argv=sys.argv[1:]):
    try:
        uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=DEBUG)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
