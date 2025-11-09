from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence
from sqlalchemy import select
from app.models.user import User
from app.models.opportunities import Opportunity
from app.models.savedopportunities import SavedOpportunity
from app.schemas.opportunity import OpportunityCreateSchema


class OpportunityService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_opportunity(
        self, user: User, opportunity_data: OpportunityCreateSchema
    ) -> None:
        """Save a new opportunity to the database."""
        stmt = select(Opportunity).where(
            Opportunity.api_id == opportunity_data.api_id
        )
        result = await self._session.execute(stmt)
        opportunity = result.scalar_one_or_none()

        if opportunity is None:
            opportunity = Opportunity(**opportunity_data.model_dump())
            self._session.add(opportunity)
            await self._session.flush()  # ensure id for SavedOpportunity FK

        saved_opportunity = SavedOpportunity(
            user_id=user.id,
            opportunity_id=opportunity.id,
        )
        self._session.add(saved_opportunity)
        await self._session.commit()

    async def get_saved_opportunities(self, user: User) -> Sequence[Opportunity]:
        """Return all opportunities saved by the given user."""
        stmt = (
            select(Opportunity)
            .join(SavedOpportunity, SavedOpportunity.opportunity_id == Opportunity.id)
            .where(SavedOpportunity.user_id == user.id)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()
