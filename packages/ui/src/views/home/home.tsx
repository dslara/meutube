import { Main } from '../main/main';

interface HomeProps {
  title: string;
}

export const Home = (props: HomeProps) => {
  return (
    <Main title={props.title}>
      <h1 className="text-3xl font-bold mb-6">Página Inicial</h1>

      <div x-data="{ showForm: false }">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => { /* Alpine.js irá capturar o evento */ }}
          x-on:click="showForm = !showForm"
        >
          Toggle Formulário (Alpine)
        </button>

        <div x-show="showForm" className="mt-4 p-4 border border-gray-300 rounded" style={{ display: 'none' }}>
            <h3 className="text-xl mb-3">Novo Conteúdo</h3>
            
            <div id="result-message" className="mt-4 text-sm text-blue-600">
                Aguardando submissão...
            </div>
        </div>
      </div>
    </Main>
  );
};
