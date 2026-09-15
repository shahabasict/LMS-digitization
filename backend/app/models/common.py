from typing import Any

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """ObjectId wrapper that is both JSON (de)serializable and Pydantic validated."""

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any):
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.no_info_plain_validator_function(cls._validate),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda value: str(value)
            ),
        )

    @classmethod
    def _validate(cls, value: Any) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")
        return ObjectId(value)


class BaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )


class DBModel(BaseModel):
    id: PyObjectId = Field(default=None)
    created_at: Any = None
    updated_at: Any = None

    @classmethod
    def from_doc(cls, doc: dict) -> "DBModel":
        """Build an output model from a raw MongoDB document (handles _id → id)."""
        data = dict(doc)
        raw_id = data.pop("_id", None)
        data["id"] = raw_id if raw_id is not None else data.get("id")
        return cls(**data)

    def mongo_doc(self) -> dict:
        data = self.model_dump(exclude_none=True, mode="python")
        data.pop("id", None)
        return data