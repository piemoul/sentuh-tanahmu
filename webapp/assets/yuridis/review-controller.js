// Same native yyb/zyb/Ayb rows and lifecycle, with JTb's true branch recipe.
// No lost-certificate reviewType or pagination reaches the injected read.
import {createLostReview} from '../lost-review/controller.js';
export function createYuridisReview({read,...lifecycle}={}){
 if(typeof read!=='function')throw new TypeError('YURIDIS_REVIEW_READ_REQUIRED');
 return createLostReview({...lifecycle,read:({contentId})=>read({reviewType:'sertipikatSaya',contentId})});
}
