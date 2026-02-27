import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext) => {
	const request = context.switchToHttp().getRequest();
	const member = request.user;

	if (!member) return null;

	return data ? member?.[data] : member;
});
