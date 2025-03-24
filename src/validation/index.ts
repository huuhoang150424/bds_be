
import {validatorLogin,validatorRegister} from "./auth.validation";
import {validateCreatePost,validateCreatePostDraft} from "./post.validation";
import {validatorCreateComment,validatorUpdateComment,validatorReplyToComment} from "./comment.validation";
import {validatorCreateNews,validatorUpdateNews} from "./news.validation";
import {validatorReport} from "./reports.validation";
import {ratingValidation} from "./rating.validation";



export {
	validatorLogin,
	validatorRegister,
	validateCreatePost,
	validateCreatePostDraft,
	validatorCreateComment,
	validatorUpdateComment,
	validatorReplyToComment,
	validatorUpdateNews,
	validatorCreateNews,
	validatorReport,
	ratingValidation
}
