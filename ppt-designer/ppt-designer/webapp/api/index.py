"""
PPT Professional Designer - Vercel Serverless Function
Backend API for template recommendation system
"""

import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
import os
from flask import Flask, request, jsonify
from flask_cors import CORS


# QuestionType Enum
class QuestionType(Enum):
    """Question types for the questionnaire system"""
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT = "text"
    BOOLEAN = "boolean"
    BOOLEAN_WITH_DETAILS = "boolean_with_details"


# Get JSON config path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_CONFIG_PATH = os.path.join(BASE_DIR, "ppt_designer_system.json")


@dataclass
class Question:
    """Represents a single strategic question"""
    question_id: str
    question_text: str
    question_type: str
    required: bool
    weight: int
    options: Optional[List[str]] = None
    follow_up: Optional[str] = None
    placeholder: Optional[str] = None


@dataclass
class UserResponse:
    """Stores user's response to a question"""
    question_id: str
    response: Any
    additional_details: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TemplateRecommendation:
    """Represents a template recommendation with matching score"""
    template_name: str
    template_url: str
    match_score: float
    style_tags: List[str]
    pros: List[str]
    cons: List[str]
    customization_difficulty: str
    preview_image: Optional[str] = None


class PPTDesignerSystem:
    """Main system class for PPT Designer"""
    
    def __init__(self, config_path: str = JSON_CONFIG_PATH):
        """Initialize the system with configuration"""
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        
        self.user_responses: Dict[str, Dict] = {}
        self.recommendations: List[Dict] = []
        
    def get_all_questions(self) -> List[Dict]:
        """Get all questions from all phases"""
        questions = []
        for phase in self.config['workflow_phases']:
            for section in phase['sections']:
                for q_data in section['strategic_questions']:
                    questions.append(q_data)
        return questions
    
    def get_questions_by_phase(self, phase_id: int) -> List[Dict]:
        """Get questions for a specific phase"""
        questions = []
        if 0 < phase_id <= len(self.config['workflow_phases']):
            phase = self.config['workflow_phases'][phase_id - 1]
            for section in phase['sections']:
                for q_data in section['strategic_questions']:
                    questions.append(q_data)
        return questions
    
    def submit_response(self, question_id: str, response: Any, 
                       additional_details: Optional[str] = None) -> bool:
        """Submit a user response"""
        user_response = {
            'question_id': question_id,
            'response': response,
            'additional_details': additional_details,
            'timestamp': datetime.now().isoformat()
        }
        self.user_responses[question_id] = user_response
        return True
    
    def calculate_profile_score(self) -> Dict[str, float]:
        """Calculate weighted scores for user profile"""
        scores = {
            'content_goals': 0.0,
            'audience_context': 0.0,
            'design_preferences': 0.0,
            'technical_requirements': 0.0,
            'timeline_resources': 0.0,
            'scalability': 0.0
        }
        
        category_mapping = {
            'q1.1': 'content_goals',
            'q1.2': 'audience_context',
            'q1.3': 'design_preferences',
            'q2.1': 'design_preferences',
            'q2.2': 'technical_requirements',
            'q3.1': 'content_goals',
            'q3.2': 'audience_context',
            'q4.1': 'technical_requirements',
            'q4.2': 'technical_requirements',
            'q5.1': 'timeline_resources',
            'q5.2': 'scalability'
        }
        
        max_scores = self.config['scoring_system']['weight_distribution']
        
        for question_id, response in self.user_responses.items():
            prefix = '.'.join(question_id.split('.')[:2])
            category = category_mapping.get(prefix)
            
            if category and response.get('response'):
                question = self._find_question(question_id)
                if question:
                    score_contribution = question['weight'] / 10.0
                    scores[category] += score_contribution
        
        for category in scores:
            max_score = max_scores[category]
            scores[category] = min(scores[category] * 2, max_score)
        
        return scores
    
    def _find_question(self, question_id: str) -> Optional[Dict]:
        """Find question data by ID"""
        for phase in self.config['workflow_phases']:
            for section in phase['sections']:
                for q_data in section['strategic_questions']:
                    if q_data['question_id'] == question_id:
                        return q_data
        return None
    
    def calculate_template_match_score(self, template_data: Dict[str, Any]) -> float:
        """Calculate how well a template matches user requirements"""
        match_factors = {
            'style_match': 0.0,
            'color_match': 0.0,
            'functionality_match': 0.0,
            'technical_compatibility': 0.0
        }
        
        user_style = self.user_responses.get('q2.1.1')
        if user_style and user_style['response'].lower() in template_data.get('style_tags', []):
            match_factors['style_match'] = 25.0
        
        user_color = self.user_responses.get('q1.3.2')
        if user_color and user_color['response'] in template_data.get('color_schemes', []):
            match_factors['color_match'] = 20.0
        
        user_goal = self.user_responses.get('q1.1.1')
        if user_goal and user_goal['response'] in template_data.get('suitable_for', []):
            match_factors['functionality_match'] = 30.0
        
        user_version = self.user_responses.get('q2.2.1')
        if user_version and user_version['response'] in template_data.get('compatible_versions', []):
            match_factors['technical_compatibility'] = 25.0
        
        final_score = sum(match_factors.values())
        return min(final_score, 100.0)
    
    def generate_recommendations(self, templates_database: List[Dict]) -> List[Dict]:
        """Generate template recommendations based on user profile"""
        recommendations = []
        
        for template in templates_database:
            match_score = self.calculate_template_match_score(template)
            
            recommendation = {
                'template_name': template['name'],
                'template_url': template['url'],
                'match_score': match_score,
                'style_tags': template.get('style_tags', []),
                'pros': template.get('pros', []),
                'cons': template.get('cons', []),
                'customization_difficulty': template.get('difficulty', 'medium'),
                'preview_image': template.get('preview_image')
            }
            recommendations.append(recommendation)
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        self.recommendations = recommendations
        
        return recommendations[:10]
    
    def generate_implementation_plan(self) -> Dict[str, Any]:
        """Generate step-by-step implementation plan"""
        timeline = self.user_responses.get('q5.1.1')
        experience = self.user_responses.get('q5.1.2')
        
        plan = {
            'timeline': timeline['response'] if timeline else '1주',
            'experience_level': experience['response'] if experience else '중급자',
            'phases': [],
            'resources_needed': [],
            'estimated_hours': 0
        }
        
        if timeline:
            timeline_key = {
                '1일': 'tight_timeline_1day',
                '1주': 'standard_timeline_1week',
                '1개월': 'extended_timeline_1month'
            }.get(timeline['response'], 'standard_timeline_1week')
            
            roadmap = self.config['workflow_phases'][4]['sections'][0]['implementation_roadmaps'].get(timeline_key, {})
            plan['phases'] = roadmap.get('steps', [])
            plan['resources_needed'] = [roadmap.get('resources', '')]
            plan['customization_level'] = roadmap.get('customization_level', 'moderate')
        
        return plan
    
    def get_progress_percentage(self) -> float:
        """Calculate questionnaire completion progress"""
        all_questions = self.get_all_questions()
        required_questions = [q for q in all_questions if q.get('required', False)]
        
        answered_required = sum(
            1 for q in required_questions 
            if q['question_id'] in self.user_responses
        )
        
        if not required_questions:
            return 100.0
        
        return (answered_required / len(required_questions)) * 100.0


# Mock template database
MOCK_TEMPLATES = [
    {
        'name': 'Minimal Beige Professional',
        'url': 'https://example.com/template1',
        'style_tags': ['minimal', 'modern', 'professional'],
        'color_schemes': ['beige_orange'],
        'suitable_for': ['교육', '정보 전달'],
        'compatible_versions': ['2019', '2021', 'Microsoft 365'],
        'pros': ['깔끔한 디자인', '쉬운 편집', '다양한 레이아웃'],
        'cons': ['애니메이션 제한적'],
        'difficulty': 'easy',
        'preview_image': 'https://example.com/preview1.jpg',
        'slide_count': '20-30',
        'features': ['charts', 'infographics', 'icons']
    },
    {
        'name': 'Modern Education Template',
        'url': 'https://example.com/template2',
        'style_tags': ['modern', 'creative', 'educational'],
        'color_schemes': ['beige_orange', 'blue_gray'],
        'suitable_for': ['교육', '발표'],
        'compatible_versions': ['2016', '2019', '2021', 'Microsoft 365'],
        'pros': ['학생 친화적', '시각적 요소 풍부', '접근성 우수'],
        'cons': ['파일 크기 큼'],
        'difficulty': 'medium',
        'preview_image': 'https://example.com/preview2.jpg',
        'slide_count': '30-40',
        'features': ['image_placeholders', 'timelines', 'quizzes']
    }
]


# Flask app
app = Flask(__name__)
CORS(app)

# Global system instance (in production, use session/database)
system = PPTDesignerSystem()


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'PPT Professional Designer API',
        'version': '1.0.0'
    })


@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get all questions"""
    try:
        questions = system.get_all_questions()
        return jsonify({
            'success': True,
            'questions': questions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/questions/phase/<int:phase_id>', methods=['GET'])
def get_questions_by_phase(phase_id):
    """Get questions by phase"""
    try:
        questions = system.get_questions_by_phase(phase_id)
        return jsonify({
            'success': True,
            'phase_id': phase_id,
            'questions': questions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/responses', methods=['POST'])
def submit_response():
    """Submit user response"""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        response = data.get('response')
        additional_details = data.get('additional_details')
        
        if not question_id or response is None:
            return jsonify({
                'success': False,
                'error': 'question_id and response are required'
            }), 400
        
        success = system.submit_response(question_id, response, additional_details)
        
        return jsonify({
            'success': success,
            'message': 'Response submitted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/profile/score', methods=['GET'])
def get_profile_score():
    """Get profile scores"""
    try:
        scores = system.calculate_profile_score()
        return jsonify({
            'success': True,
            'scores': scores
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get template recommendations"""
    try:
        recommendations = system.generate_recommendations(MOCK_TEMPLATES)
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/implementation-plan', methods=['GET'])
def get_implementation_plan():
    """Get implementation plan"""
    try:
        plan = system.generate_implementation_plan()
        return jsonify({
            'success': True,
            'plan': plan
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Get questionnaire progress"""
    try:
        progress = system.get_progress_percentage()
        return jsonify({
            'success': True,
            'progress': progress
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Vercel serverless function handler
def handler(request):
    """Vercel serverless function handler"""
    with app.request_context(request.environ):
        return app.full_dispatch_request()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
